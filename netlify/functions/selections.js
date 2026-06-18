// Lưu / đọc lựa chọn ảnh của khách (chọn ảnh + ghi chú) trên máy chủ Netlify Blobs.
// Để khách có thể thoát ra, vào lại từ máy khác mà không mất.
//
//   GET  /.netlify/functions/selections?code=XXX
//        -> { ok, data: { ids: [...], notes: {...}, updated_at } }
//
//   POST /.netlify/functions/selections  { code, ids, notes }
//        -> { ok }
//
// Không cần đăng nhập: mã (code) là khoá. Cùng cơ chế bảo vệ với phần xem ảnh hiện tại.

const { getStore } = require("@netlify/blobs");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const params = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === "POST") {
    try { body = JSON.parse(event.body || "{}"); } catch (_) {}
  }
  const code = String(body.code || params.code || "").trim().toUpperCase();
  if (!code || !/^[A-Z0-9_\-]{2,32}$/.test(code)) {
    return { statusCode: 400, headers: { ...CORS, "Content-Type": "application/json" },
             body: JSON.stringify({ error: "Mã không hợp lệ" }) };
  }

  let store;
  try {
    store = getStore("hello-selections");
  } catch (e) {
    // Blobs chưa sẵn sàng -> trả về rỗng, để khách dùng tạm localStorage.
    return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" },
             body: JSON.stringify({ ok: true, data: { ids: [], notes: {}, updated_at: null },
                                    warn: "blobs-unavailable", err: (e && e.message) || String(e) }) };
  }

  const okHeaders = { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" };

  if (event.httpMethod === "GET") {
    try {
      const data = await store.get(code, { type: "json" });
      return { statusCode: 200, headers: okHeaders,
               body: JSON.stringify({ ok: true, data: data || { ids: [], notes: {}, updated_at: null } }) };
    } catch (e) {
      return { statusCode: 502, headers: okHeaders,
               body: JSON.stringify({ error: e.message }) };
    }
  }

  if (event.httpMethod === "POST") {
    const ids = Array.isArray(body.ids)
      ? body.ids.filter(function (x) { return typeof x === "string"; }).slice(0, 10000)
      : [];
    const notes = (body.notes && typeof body.notes === "object" && !Array.isArray(body.notes))
      ? body.notes : {};
    try {
      await store.setJSON(code, { ids: ids, notes: notes, updated_at: new Date().toISOString() });
      return { statusCode: 200, headers: okHeaders, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 502, headers: okHeaders, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers: okHeaders, body: JSON.stringify({ error: "Method not allowed" }) };
};
