// Cầu nối lấy số liệu Microsoft Clarity — giữ khóa API ở phía máy chủ.
exports.handler = async function (event, context) {
  // Chỉ cho người đã đăng nhập /admin (Netlify Identity) xem
  var user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Chưa đăng nhập" }) };
  }
  var token = process.env.CLARITY_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Chưa cấu hình CLARITY_TOKEN trên Netlify" }) };
  }
  var days = (event.queryStringParameters && event.queryStringParameters.days) || "3";
  if (["1", "2", "3"].indexOf(days) === -1) days = "3";
  try {
    var resp = await fetch(
      "https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=" + days,
      { headers: { Authorization: "Bearer " + token } }
    );
    var text = await resp.text();
    return {
      statusCode: resp.ok ? 200 : resp.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: resp.ok ? text : JSON.stringify({ error: "Clarity trả về lỗi " + resp.status, detail: text.slice(0, 300) })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
