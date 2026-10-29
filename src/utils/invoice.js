import api from "../api/api";
import toast from "react-hot-toast";

export const INVOICE_STATUS = {
  awaiting: "Рахунок формується / очікує надсилання",
  sent: "Рахунок надіслано — очікуємо оплату",
  paid: "Оплачено за рахунком",
  expired: "Строк дії рахунку минув — замовлення скасовано",
  cancelled: "Рахунок скасовано (обрано інший спосіб оплати)",
};

// Завантаження PDF рахунку (потрібні cookie авторизації, тому через axios, а не пряме посилання)
export const downloadInvoice = async (orderId, number) => {
  try {
    const { data } = await api.get(`/home/customer/orders/${orderId}/invoice.pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rahunok-${number || orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    toast.error("Не вдалося завантажити рахунок");
  }
};
