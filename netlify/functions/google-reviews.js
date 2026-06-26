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
    throw new Error("Find Place: " + (j.status || "không tìm thấy"));
  }
  return j.candidates[0].place_id;
}

exports.handler = async function () {
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

  if (store) {
    try {
      const cached = await store.get("latest", { type: "json" });
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
  if (!placeId) {
    try {
      placeId = await findPlaceId(apiKey);
      if (store) try { await store.setJSON("place_id", { id: placeId, t: Date.now() }); } catch (e) {}
    } catch (e) {
      return {
        statusCode: 200, headers: CORS,
        body: JSON.stringify({
          ok: false,
          error: "Không tra được Place ID: " + e.message,
          reviews: [], total: 0, rating: 0, mapsUrl: ""
        })
      };
    }
  }

  // ----- Gọi Google Places API -----
  const url = "https://maps.googleapis.com/maps/api/place/details/json"
    + "?place_id=" + encodeURIComponent(placeId)
    + "&fields=name,rating,user_ratings_total,url,reviews"
    + "&language=vi"
    + "&reviews_no_translations=true"
    + "&reviews_sort=newest"
    + "&key=" + encodeURIComponent(apiKey);

  try {
    const resp = await fetch(url);
    const json = await resp.json();
    if (json.status !== "OK") {
      return {
        statusCode: 200, headers: CORS,
        body: JSON.stringify({
          ok: false,
          error: "Google API: " + (json.status || "lỗi không rõ"),
          detail: (json.error_message || "").slice(0, 200),
          reviews: [], total: 0, rating: 0, mapsUrl: ""
        })
      };
    }
    const r = json.result || {};
    const reviews = (Array.isArray(r.reviews) ? r.reviews : [])
      .filter(x => x && (x.rating || 0) >= MIN_RATING)
      .map(x => ({
        name: x.author_name || "",
        avatar: x.profile_photo_url || "",
        rating: x.rating || 0,
        text: x.text || "",
        time_text: x.relative_time_description || "",
        time: x.time || 0
      }));
    const data = {
      total: r.user_ratings_total || 0,
      rating: r.rating || 0,
      mapsUrl: r.url || "",
      reviews: reviews
    };
    if (store) {
      try { await store.setJSON("latest", { t: Date.now(), d: data }); } catch (e) {}
    }
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({ ok: true, cached: false, ts: Date.now(), ...data })
    };
  } catch (e) {
    return {
      statusCode: 502, headers: CORS,
      body: JSON.stringify({ ok: false, error: e.message, reviews: [], total: 0, rating: 0, mapsUrl: "" })
    };
  }
};
