import api from "../api/api";

// POST-форма (потрібна для LiqPay Checkout)
const submitForm = (url, fields) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.acceptCharset = "utf-8";
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
};

// Починає оплату обраним способом: перехід на банк / підтвердження / рахунок.
export async function startPayment({ orderId, method, navigate }) {
  const { data } = await api.post("/pay/start", { orderId, method });
  if (data.type === "invoice") {
    navigate(
      `/order/confirm?orderId=${orderId}&method=invoice&emailed=${data.emailed ? 1 : 0}&number=${encodeURIComponent(data.number || "")}`
    );
  } else if (data.type === "cod") {
    navigate(`/order/confirm?orderId=${orderId}&method=cod`);
  } else if (data.type === "form") {
    submitForm(data.url, data.fields);
  } else if (data.type === "redirect") {
    if (data.internal) navigate(`/pay/mock?orderId=${orderId}`);
    else window.location.href = data.url;
  }
}
