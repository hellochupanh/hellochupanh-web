// Lưu / đọc lựa chọn ảnh của khách (chọn ảnh + ghi chú) trên máy chủ Netlify Blobs.
// Để khách có thể thoát ra, vào lại từ máy khác mà không mất.
//
//   GET  /.netlify/functions/selections?code=XXX
//        -> { ok, data: { ids: [...], notes: {...}, updated_at } }
//
//   POST /.netlify/functions/selections  { code, ids, notes }
//        -> { ok }
//
//   GET  /.netlify/functions/selections?action=list   (yêu cầu đăng nhập admin qua Netlify Identity)
//        -> { ok, items: [{code, count, updated_at}, ...] }   — mới nhất trước
//
// Không cần đăng nhập cho GET/POST theo mã: mã (code) là khoá.
// Riêng action=list yêu cầu Netlify Identity JWT (giống bookings.js).

const { getStore } = require("@netlify/blobs");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

// Key trong store dùng để lưu chỉ mục các mã đã có selection (tra nhanh khi liệt kê).
// Dùng ký tự thường + gạch dưới để chắc chắn không đụng mã khách thật (mã khách toUpperCase).
const INDEX_KEY = "__idx__";

exports.handler = async function (event, context) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const params = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === "POST") {
    try { body = JSON.parse(event.body || "{}"); } catch (_) {}
  }

  const action = String(body.action || params.action || "").trim().toLowerCase();
  const isList = (action === "list");
  const code = String(body.code || params.code || "").trim().toUpperCase();

  const okHeaders = { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" };

  // Xác thực khi list — yêu cầu Netlify Identity JWT
  if (isList) {
    const user = context && context.clientContext && context.clientContext.user;
    if (!user) {
      return { statusCode: 401, headers: okHeaders, body: JSON.stringify({ error: "Cần đăng nhập admin" }) };
    }
  } else {
    if (!code || !/^[A-Z0-9_\-]{2,32}$/.test(code)) {
      return { statusCode: 400, headers: okHeaders, body: JSON.stringify({ error: "Mã không hợp lệ" }) };
    }
  }

  let store;
  try {
    // Cấu hình thủ công cho Blobs (môi trường không tự nhận diện được).
    const siteID = process.env.SITE_ID || "938a8072-c4e4-43f7-8e78-bbdabfbe01b0";
    const token  = process.env.NETLIFY_TOKEN;
    if (!token) throw new Error("Thiếu NETLIFY_TOKEN trong env vars");
    store = getStore({ name: "hello-selections", siteID: siteID, token: token });
  } catch (e) {
    if (isList) {
      return { statusCode: 500, headers: okHeaders, body: JSON.stringify({ error: (e && e.message) || String(e) }) };
    }
    // Blobs chưa sẵn sàng -> trả về rỗng, để khách dùng tạm localStorage.
    return { statusCode: 200, headers: okHeaders,
             body: JSON.stringify({ ok: true, data: { ids: [], notes: {}, updated_at: null },
                                    warn: "blobs-unavailable", err: (e && e.message) || String(e) }) };
  }

  // ====== LIST (admin) ======
  if (isList) {
    try {
      const idx = (await store.get(INDEX_KEY, { type: "json" })) || { codes: {} };
      const items = Object.entries(idx.codes || {}).map(function (kv) {
        const c = kv[0], meta = kv[1] || {};
        return { code: c, count: meta.count || 0, updated_at: meta.updated_at || null };
      });
      // Mới nhất trước
      items.sort(function (a, b) {
        return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
      });
      return { statusCode: 200, headers: okHeaders, body: JSON.stringify({ ok: true, items: items }) };
    } catch (e) {
      return { statusCode: 502, headers: okHeaders, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ====== GET đơn lẻ theo mã ======
  if (event.httpMethod === "GET") {
    try {
      const data = await store.get(code, { type: "json" });
      return { statusCode: 200, headers: okHeaders,
               body: JSON.stringify({ ok: true, data: data || { ids: [], notes: {}, updated_at: null } }) };
    } catch (e) {
      return { statusCode: 502, headers: okHeaders, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ====== POST lưu + cập nhật chỉ mục ======
  if (event.httpMethod === "POST") {
    const ids = Array.isArray(body.ids)
      ? body.ids.filter(function (x) { return typeof x === "string"; }).slice(0, 10000)
      : [];
    const notes = (body.notes && typeof body.notes === "object" && !Array.isArray(body.notes))
      ? body.notes : {};
    const updated_at = new Date().toISOString();
    try {
      await store.setJSON(code, { ids: ids, notes: notes, updated_at: updated_at });
      // Cập nhật chỉ mục (best-effort, không chặn nếu lỗi)
      try {
        const idx = (await store.get(INDEX_KEY, { type: "json" })) || { codes: {} };
        idx.codes = idx.codes || {};
        if (ids.length > 0) {
          idx.codes[code] = { count: ids.length, updated_at: updated_at };
        } else {
          // Bỏ khỏi chỉ mục nếu khách bỏ chọn hết
          delete idx.codes[code];
        }
        await store.setJSON(INDEX_KEY, idx);
      } catch (idxErr) { /* bỏ qua lỗi index */ }
      return { statusCode: 200, headers: okHeaders, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 502, headers: okHeaders, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers: okHeaders, body: JSON.stringify({ error: "Method not allowed" }) };
};
