import React, { useCallback } from "react";
import api from "../api/api";
import Autocomplete from "./Autocomplete";
import { DELIVERY_TYPES, OBLASTS } from "../utils/delivery";

const inputCls =
  "w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md bg-transparent";

const Plain = ({ label, name, value, onChange, ...rest }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-sm">{label}</label>
    <input name={name} value={value} onChange={onChange} className={inputCls} {...rest} />
  </div>
);

// Вибір способу доставки Нової пошти й адреси. npOn — працюють підказки API Нової пошти
// (місто → відділення/поштомат/вулиця); інакше — ручне введення (область зі списку).
const DeliveryFields = ({ form, setForm, npOn, onNpOff }) => {
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchCities = useCallback(
    async (q) => {
      const { data } = await api.get("/np/cities", { params: { q } });
      if (data.enabled === false) onNpOff?.();
      return data.items;
    },
    [onNpOff]
  );
  const fetchWarehouses = useCallback(
    async (q) => {
      const { data } = await api.get("/np/warehouses", {
        params: { cityRef: form.cityRef, q, type: form.deliveryType === "nova_poshta_postomat" ? "postomat" : "warehouse" },
      });
      return data.items;
    },
    [form.cityRef, form.deliveryType]
  );
  const fetchStreets = useCallback(
    async (q) => {
      const { data } = await api.get("/np/streets", { params: { settlementRef: form.settlementRef, q } });
      return data.items;
    },
    [form.settlementRef]
  );

  const courier = form.deliveryType === "nova_poshta_courier";
  const postomat = form.deliveryType === "nova_poshta_postomat";

  return (
    <>
      <p className="text-sm mb-2 font-semibold">Нова пошта</p>
      <div className="flex gap-2 flex-wrap mb-3">
        {DELIVERY_TYPES.map((d) => (
          <button
            type="button"
            key={d.id}
            onClick={() => setForm({ ...form, deliveryType: d.id, warehouse: "", warehouseRef: "" })}
            className={`px-4 py-2 rounded-md border text-sm ${
              form.deliveryType === d.id ? "border-[var(--border-ship-foc)] font-semibold bg-[var(--bg-stripe)]" : "border-[var(--border-ship)]"
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      {npOn ? (
        <div className="mb-3">
          <Autocomplete
            label="Населений пункт *"
            value={form.city}
            placeholder="Почніть вводити назву міста"
            onText={(t) => setForm({ ...form, city: t, district: "", cityRef: "", settlementRef: "", warehouseRef: "", warehouse: "", street: "" })}
            onPick={(c) =>
              setForm({ ...form, city: c.name, district: c.area, cityRef: c.ref, settlementRef: c.settlementRef, warehouseRef: "", warehouse: "", street: "" })
            }
            fetcher={fetchCities}
          />
          {form.cityRef && (
            <p className="text-xs opacity-60 mt-1">
              {form.city}, {form.district} обл.
            </p>
          )}
        </div>
      ) : (
        <div className="flex max-md:flex-col gap-3 mb-3">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm">Область *</label>
            <select name="district" value={form.district} onChange={set} className={inputCls}>
              <option value="">Оберіть область</option>
              {OBLASTS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <Plain label="Населений пункт *" name="city" value={form.city} onChange={set} placeholder="Київ" />
        </div>
      )}

      {courier ? (
        <div className="flex max-md:flex-col gap-3">
          {npOn ? (
            <Autocomplete
              label="Вулиця *"
              value={form.street}
              disabled={!form.settlementRef}
              placeholder={form.settlementRef ? "Почніть вводити назву вулиці" : "Спершу оберіть населений пункт"}
              onText={(t) => setForm({ ...form, street: t })}
              onPick={(st) => setForm({ ...form, street: st.name })}
              fetcher={fetchStreets}
            />
          ) : (
            <Plain label="Вулиця *" name="street" value={form.street} onChange={set} />
          )}
          <Plain label="Будинок *" name="house" value={form.house} onChange={set} />
          <Plain label="Квартира" name="flat" value={form.flat} onChange={set} />
        </div>
      ) : npOn ? (
        <Autocomplete
          label={postomat ? "Поштомат *" : "Відділення *"}
          value={form.warehouse}
          disabled={!form.cityRef}
          loadOnFocus
          placeholder={form.cityRef ? "Введіть адресу або номер відділення" : "Спершу оберіть населений пункт"}
          onText={(t) => setForm({ ...form, warehouse: t, warehouseRef: "" })}
          onPick={(w) => setForm({ ...form, warehouse: w.title, warehouseRef: w.ref })}
          fetcher={fetchWarehouses}
        />
      ) : (
        <Plain label={postomat ? "№ поштомата *" : "№ відділення *"} name="warehouse" value={form.warehouse} onChange={set} placeholder="Напр. 12" />
      )}
    </>
  );
};

export default DeliveryFields;
