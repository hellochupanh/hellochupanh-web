// Lấy danh sách đơn đặt lịch (Netlify Forms) — chỉ cho người đã đăng nhập /admin.
exports.handler = async function (event, context) {
  var user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Chưa đăng nhập" }) };
  }
  var token = process.env.NETLIFY_TOKEN;
  if (!token) {
    return { statusCode: 200, body: JSON.stringify({ error: "Chưa cấu hình NETLIFY_TOKEN trên Netlify" }) };
  }
  try {
    var siteId = process.env.SITE_ID || "938a8072-c4e4-43f7-8e78-bbdabfbe01b0";
    var resp = await fetch("https://api.netlify.com/api/v1/sites/" + siteId + "/submissions?per_page=200", {
      headers: { Authorization: "Bearer " + token }
    });
    if (!resp.ok) {
      var t = await resp.text();
      return { statusCode: 200, body: JSON.stringify({ error: "Netlify trả về lỗi " + resp.status, detail: t.slice(0, 200) }) };
    }
    var all = await resp.json();
    var list = (Array.isArray(all) ? all : []).filter(function (s) { return (s.form_name || "") === "booking"; });
    var bookings = list.map(function (s) {
      var d = s.data || {};
      return {
        name: d.name || "",
        phone: d.phone || "",
        service: d.service || "",
        date: d.date || "",
        note: d.note || "",
        created_at: s.created_at || ""
      };
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ ok: true, count: bookings.length, bookings: bookings })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
