// Спільна логіка полів доставки Нової пошти (оформлення замовлення й «Налаштування»).

export const OBLASTS = [
  "Вінницька", "Волинська", "Дніпропетровська", "Донецька", "Житомирська", "Закарпатська", "Запорізька",
  "Івано-Франківська", "Київська", "Кіровоградська", "Луганська", "Львівська", "Миколаївська", "Одеська",
  "Полтавська", "Рівненська", "Сумська", "Тернопільська", "Харківська", "Херсонська", "Хмельницька",
  "Черкаська", "Чернівецька", "Чернігівська", "м. Київ", "АР Крим",
];

export const DELIVERY_TYPES = [
  { id: "nova_poshta_warehouse", title: "У відділення" },
  { id: "nova_poshta_postomat", title: "У поштомат" },
  { id: "nova_poshta_courier", title: "Курєром" },
];

export const emptyDelivery = () => ({
  deliveryType: "nova_poshta_warehouse",
  district: "",
  city: "",
  cityRef: "",
  settlementRef: "",
  warehouse: "",
  warehouseRef: "",
  street: "",
  house: "",
  flat: "",
});

// Адреса курєра одним рядком (так зберігає сервер)
export const courierAddress = (f) =>
  [`вул. ${f.street.trim()}`, `буд. ${f.house.trim()}`, f.flat.trim() && `кв. ${f.flat.trim()}`].filter(Boolean).join(", ");

// Зворотне перетворення збереженої адреси курєра на поля форми
export const parseCourierAddress = (address = "") => {
  const m = address.match(/^вул\. (.*?), буд\. (.*?)(?:, кв\. (.*))?$/);
  return m ? { street: m[1], house: m[2], flat: m[3] || "" } : { street: address, house: "", flat: "" };
};

// Збережена адреса → поля форми
export const fromSaved = (a) => ({
  ...emptyDelivery(),
  deliveryType: a.deliveryType,
  district: a.district || "",
  city: a.city || "",
  cityRef: a.cityRef || "",
  settlementRef: a.settlementRef || "",
  warehouse: a.warehouse || "",
  warehouseRef: a.warehouseRef || "",
  ...(a.deliveryType === "nova_poshta_courier" ? parseCourierAddress(a.address) : {}),
});

// Поля форми → об'єкт для сервера
export const toPayload = (f) => ({
  deliveryType: f.deliveryType,
  district: f.district,
  city: f.city,
  cityRef: f.cityRef,
  settlementRef: f.settlementRef,
  warehouse: f.deliveryType === "nova_poshta_courier" ? "" : f.warehouse,
  warehouseRef: f.deliveryType === "nova_poshta_courier" ? "" : f.warehouseRef,
  address: f.deliveryType === "nova_poshta_courier" ? courierAddress(f) : "",
});

// Перший недолік адреси або "" (npOn — підключено підказки Нової пошти)
export const deliveryError = (f, npOn) => {
  if (npOn && !f.cityRef) return "Оберіть населений пункт зі списку";
  if (!npOn && f.district.trim().length < 2) return "Оберіть область";
  if (f.city.trim().length < 2) return "Вкажіть населений пункт";
  if (f.deliveryType === "nova_poshta_courier") {
    if (f.street.trim().length < 2) return "Вкажіть вулицю";
    if (!f.house.trim()) return "Вкажіть номер будинку";
    return "";
  }
  if (npOn && !f.warehouseRef) {
    return f.deliveryType === "nova_poshta_postomat" ? "Оберіть поштомат зі списку" : "Оберіть відділення зі списку";
  }
  if (!f.warehouse.trim()) return f.deliveryType === "nova_poshta_postomat" ? "Вкажіть № поштомата" : "Вкажіть № відділення";
  return "";
};

export const savedAddressTitle = (a) => {
  const kind = { nova_poshta_warehouse: "Відділення", nova_poshta_postomat: "Поштомат", nova_poshta_courier: "Курєр" }[a.deliveryType] || "";
  const place = a.deliveryType === "nova_poshta_courier" ? a.address : a.warehouse;
  return { head: `${kind} · ${a.city}`, sub: place };
};
