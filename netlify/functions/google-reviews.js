// Lấy đánh giá khách hàng từ Google Maps (Places API), lọc các đánh giá ≥ MIN_RATING sao.
// Có cache trong Netlify Blobs (1 giờ) để tránh gọi API quá nhiều.
//
// Cần env vars trên Netlify:
//   GOOGLE_API_KEY   — Khoá Google Cloud Places API
//   GOOGLE_PLACE_ID  — Mã địa điểm (Place ID) của Hello Chụp Ảnh
//
// Trả về: { ok, total, rating, mapsUrl, reviews:[{name,avatar,rating,text,time_text}], cached, ts }

const { getStore } = require("@netlify/blobs");

const MIN_RATING = 4;            // chỉ hiện đánh giá ≥ 4 sao
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 giờ

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=300",
  "Content-Type": "application/json"
};

// Toạ độ + tên doanh nghiệp Hello Chụp Ảnh (lấy từ Google Maps).
// Dùng để tra Place ID tự động nếu chưa có GOOGLE_PLACE_ID.
const DEFAULT_NAME = "Hello Chụp Ảnh";
const DEFAULT_LAT  = 10.7722345;
const DEFAULT_LNG  = 106.6797308;

// Places API (New) – textSearch
async function findPlaceIdNew(apiKey) {
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName"
    },
    body: JSON.stringify({
      textQuery: DEFAULT_NAME,
      locationBias: {
        circle: { center: { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG }, radius: 800 }
      }
    })
  });
  const j = await r.json();
  if (!r.ok) {
    const m = (j && j.error && j.error.message) ? j.error.message : ("HTTP " + r.status);
    throw new Error("searchText (new): " + m);
  }
  if (!j.places || !j.places[0] || !j.places[0].id) {
    throw new Error("searchText (new): không tìm thấy");
  }
  return j.places[0].id;
}

// Places API (Legacy) – findplacefromtext
async function findPlaceId(apiKey) {
  const url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    + "?input=" + encodeURIComponent(DEFAULT_NAME)
    + "&inputtype=textquery"
    + "&locationbias=circle%3A800%40" + DEFAULT_LAT + "%2C" + DEFAULT_LNG
    + "&fields=place_id,name"
    + "&key=" + encodeURIComponent(apiKey);
  const r = await fetch(url);
  const j = await r.json();
  if (j.status !== "OK" || !j.candidates || !j.candidates[0]) {
    const msg = j.error_message ? (j.status + " — " + j.error_message) : (j.status || "không tìm thấy");
    throw new Error("Find Place: " + msg);
  }
  return j.candidates[0].place_id;
}

exports.handler = async function (event) {
  const apiKey   = process.env.GOOGLE_API_KEY;
  let   placeId  = process.env.GOOGLE_PLACE_ID;
  if (!apiKey) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        ok: false,
        error: "Chưa cấu hình GOOGLE_API_KEY trên Netlify",
        reviews: [], total: 0, rating: 0, mapsUrl: ""
      })
    };
  }

  // ----- Cache -----
  let store = null;
  try {
    const siteID = process.env.SITE_ID || "938a8072-c4e4-43f7-8e78-bbdabfbe01b0";
    const token  = process.env.NETLIFY_TOKEN;
    if (token) store = getStore({ name: "google-reviews-cache", siteID, token });
  } catch (e) { /* Blobs không sẵn sàng — vẫn chạy bình thường, chỉ là không cache */ }

  const params = (event && event.queryStringParameters) || {};
  const skipCache = (params.refresh === "1");
  if (store && !skipCache) {
    try {
      const cached = await store.get("latest_v3", { type: "json" });
      if (cached && cached.t && (Date.now() - cached.t) < CACHE_TTL_MS) {
        return {
          statusCode: 200, headers: CORS,
          body: JSON.stringify({ ok: true, cached: true, ts: cached.t, ...cached.d })
        };
      }
    } catch (e) { /* bỏ qua lỗi cache */ }
  }

  // Tự tra Place ID nếu chưa có (chỉ làm 1 lần, cache vào Blobs)
  if (!placeId && store) {
    try {
      const cachedPid = await store.get("place_id", { type: "json" });
      if (cachedPid && cachedPid.id) placeId = cachedPid.id;
    } catch (e) {}
  }
  // DEBUG: thông tin nhận diện khoá (chỉ đầu/cuối, không phải khoá thật)
  var keyDebug = apiKey
    ? (apiKey.slice(0,6) + "..." + apiKey.slice(-4) + " [" + apiKey.length + " chars]")
    : "(không có)";

  if (!placeId) {
    // Thử tra qua New Places API trước (mới, ít vấn đề billing) -> fallback legacy
    try {
      placeId = await findPlaceIdNew(apiKey);
      if (store) try { await store.setJSON("place_id", { id: placeId, t: Date.now() }); } catch (e) {}
    } catch (e1) {
      try {
        placeId = await findPlaceId(apiKey);
        if (store) try { await store.setJSON("place_id", { id: placeId, t: Date.now() }); } catch (e) {}
      } catch (e2) {
        return {
          statusCode: 200, headers: CORS,
          body: JSON.stringify({
            ok: false,
            error: "Không tra được Place ID. Mới: " + e1.message + " | Cũ: " + e2.message,
            keyDebug: keyDebug,
            reviews: [], total: 0, rating: 0, mapsUrl: ""
          })
        };
      }
    }
  }

  // ----- Gọi Google Places API (New) cho Place Details -----
  // Nếu placeId từ cache hoặc env có dạng "places/ChIJ..." giữ nguyên, không có "places/" thì thêm vào.
  const resourceName = /^places\//.test(placeId) ? placeId : ("places/" + placeId);
  const detailUrl = "https://places.googleapis.com/v1/" + resourceName
    + "?languageCode=vi";
  const fieldMask = "id,displayName,rating,userRatingCount,googleMapsUri,reviews";

  try {
    const resp = await fetch(detailUrl, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask
      }
    });
    const json = await resp.json();
    if (!resp.ok) {
      const msg = (json && json.error && json.error.message) ? json.error.message : ("HTTP " + resp.status);
      return {
        statusCode: 200, headers: CORS,
        body: JSON.stringify({
          ok: false,
          error: "Place Details (new): " + msg,
          keyDebug: keyDebug,
          reviews: [], total: 0, rating: 0, mapsUrl: ""
        })
      };
    }
    const reviewsRaw = Array.isArray(json.reviews) ? json.reviews : [];
    const reviews = reviewsRaw
      .filter(x => x && (x.rating || 0) >= MIN_RATING)
      .map(x => {
        const auth = x.authorAttribution || {};
        const txt = (x.text && x.text.text) || (x.originalText && x.originalText.text) || "";
        return {
          name: auth.displayName || "",
          avatar: auth.photoUri || "",
          rating: x.rating || 0,
          text: txt,
          time_text: x.relativePublishTimeDescription || "",
          time: x.publishTime || ""
        };
      });
    const data = {
      total: json.userRatingCount || 0,
      rating: json.rating || 0,
      mapsUrl: json.googleMapsUri || "",
      reviews: reviews
    };
    if (store) {
      try { await store.setJSON("latest_v3", { t: Date.now(), d: data }); } catch (e) {}
    }
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        ok: true, cached: false, ts: Date.now(),
        debug: { rawKeys: Object.keys(json||{}), rawReviewsLen: reviewsRaw.length, filteredLen: reviews.length, keyDebug: keyDebug },
        ...data
      })
    };
  } catch (e) {
    return {
      statusCode: 502, headers: CORS,
      body: JSON.stringify({ ok: false, error: e.message, reviews: [], total: 0, rating: 0, mapsUrl: "" })
    };
  }
};
