import React, { useCallback, useState } from "react";
import { LuBuilding2, LuPackage, LuTruck } from "react-icons/lu";
import api from "../api/api";
import Autocomplete from "./Autocomplete";
import BranchPicker from "./BranchPicker";
import { inputCls, labelCls, FieldError, TextField } from "./CheckoutUi";
import { DELIVERY_TYPES, OBLASTS, deliveryError } from "../utils/delivery";

const TYPE_ICON = {
  nova_poshta_warehouse: <LuBuilding2 />,
  nova_poshta_postomat: <LuPackage />,
  nova_poshta_courier: <LuTruck />,
};

// Швидкий вибір найбільших міст. area — префікс області в довіднику НП (щоб узяти саме місто, а не село з такою ж назвою);
// oblast — значення зі списку областей для ручного режиму (без API НП).
const POPULAR_CITIES = [
  { name: "Київ", area: "Київ", oblast: "м. Київ" },
  { name: "Харків", area: "Харків", oblast: "Харківська" },
  { name: "Одеса", area: "Одес", oblast: "Одеська" },
  { name: "Дніпро", area: "Дніпропетров", oblast: "Дніпропетровська" },
  { name: "Львів", area: "Львів", oblast: "Львівська" },
];
const norm = (s) => String(s || "").trim().toLowerCase().replace(/[’`']/g, "'");
// Точний збіг: та сама назва + область; серед них — без району (обласний центр) або з позначкою «м.»
const pickCity = (items, pc) => {
  const same = (items || []).filter((c) => norm(c.name) === norm(pc.name));
  const inArea = same.filter((c) => String(c.area || "").startsWith(pc.area));
  return (
    inArea.find((c) => !c.region) ||
    inArea.find((c) => /^м\.\s?/.test(c.title || "")) ||
    inArea[0] ||
    same.find((c) => /^м\.\s?/.test(c.title || "")) ||
    null
  );
};

// Яке поле підсвічувати для повідомлення deliveryError()
const errField = (msg) => {
  if (!msg) return "";
  if (/область/i.test(msg)) return "district";
  if (/населений/i.test(msg)) return "city";
  if (/вулиц/i.test(msg)) return "street";
  if (/будинк/i.test(msg)) return "house";
  return "warehouse";
};

// Вибір способу доставки Нової пошти й адреси. npOn — працюють підказки API Нової пошти
// (місто → відділення/поштомат/вулиця); інакше — ручне введення (область зі списку).
// showErrors — показати помилки всіх полів (після «Далі»/«Оформити»); інакше — лише після blur поля.
const DeliveryFields = ({ form, setForm, npOn, onNpOff, showErrors = false, idPrefix = "del" }) => {
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const [touched, setTouched] = useState({});
  const touch = (k) => () => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  const de = deliveryError(form, npOn);
  const ef = errField(de);
  const errFor = (k) => (ef === k && (showErrors || touched[k]) ? de : "");

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

  // Чіпс популярного міста: ставить місто так само, як вибір із підказок НП (cityRef/settlementRef/область)
  const [quick, setQuick] = useState("");
  const chooseQuick = async (pc) => {
    if (quick) return;
    const reset = { warehouseRef: "", warehouse: "", street: "" };
    if (!npOn) return setForm({ ...form, ...reset, city: pc.name, district: pc.oblast });
    setQuick(pc.name);
    try {
      const { data } = await api.get("/np/cities", { params: { q: pc.name } });
      if (data.enabled === false) {
        onNpOff?.();
        setForm({ ...form, ...reset, city: pc.name, district: pc.oblast, cityRef: "", settlementRef: "" });
        return;
      }
      const c = pickCity(data.items, pc);
      if (c) setForm({ ...form, ...reset, city: c.name, district: c.area, cityRef: c.ref, settlementRef: c.settlementRef });
      // не знайшли точного збігу — підставляємо назву, покупець обере зі списку підказок
      else setForm({ ...form, ...reset, city: pc.name, district: "", cityRef: "", settlementRef: "" });
    } catch {
      setForm({ ...form, ...reset, city: pc.name, district: "", cityRef: "", settlementRef: "" });
    } finally {
      setQuick("");
    }
  };
  const showQuick = npOn ? !form.cityRef : !form.city.trim();
  const quickRow = showQuick && (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 -mt-2" role="group" aria-label="Популярні міста">
      <span className="text-[13px] text-(--ink-2)" aria-hidden="true">
        Популярні:
      </span>
      {POPULAR_CITIES.map((pc) => (
        <button
          key={pc.name}
          type="button"
          onClick={() => chooseQuick(pc)}
          disabled={!!quick}
          aria-busy={quick === pc.name || undefined}
          className="min-h-10 px-3 rounded-full border border-(--line-strong) bg-(--surface) text-[13px] font-medium text-(--ink) hover:border-(--brand) hover:text-(--brand-ink) disabled:opacity-60 disabled:cursor-wait"
        >
          {pc.name}
        </button>
      ))}
    </div>
  );

  const courier = form.deliveryType === "nova_poshta_courier";
  const postomat = form.deliveryType === "nova_poshta_postomat";
  const chooseType = (id) => setForm({ ...form, deliveryType: id, warehouse: "", warehouseRef: "" });

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelCls} mb-2`}>Спосіб доставки Новою поштою</legend>
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
          {DELIVERY_TYPES.map((d) => {
            const on = form.deliveryType === d.id;
            return (
              <label
                key={d.id}
                className={`flex xs:flex-col xs:justify-center items-center gap-3 xs:gap-1 min-h-14 px-4 xs:px-2 py-2 rounded-(--r-md) border cursor-pointer text-[15px] text-(--ink) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-(--brand) has-[:focus-visible]:outline-offset-2 ${
                  on ? "border-(--brand) bg-(--brand-soft) ring-1 ring-(--brand) font-semibold" : "border-(--line) bg-(--surface) hover:border-(--line-strong)"
                }`}
              >
                <input type="radio" name={`${idPrefix}-type`} className="sr-only" checked={on} onChange={() => chooseType(d.id)} />
                <span aria-hidden="true" className={`text-xl ${on ? "text-(--brand-ink)" : "text-(--ink-2)"}`}>
                  {TYPE_ICON[d.id]}
                </span>
                <span>{d.title}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {npOn ? (
        <Autocomplete
          id={`${idPrefix}-city`}
          label="Населений пункт *"
          value={form.city}
          placeholder="Почніть вводити назву міста"
          hint={form.cityRef ? `${form.city}, ${form.district} обл.` : "Введіть щонайменше 2 літери й оберіть зі списку"}
          error={errFor("city")}
          onBlur={touch("city")}
          onText={(t) => setForm({ ...form, city: t, district: "", cityRef: "", settlementRef: "", warehouseRef: "", warehouse: "", street: "" })}
          onPick={(c) =>
            setForm({ ...form, city: c.name, district: c.area, cityRef: c.ref, settlementRef: c.settlementRef, warehouseRef: "", warehouse: "", street: "" })
          }
          fetcher={fetchCities}
        />
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1.5 w-full min-w-0">
            <label htmlFor={`${idPrefix}-district`} className={labelCls}>
              Область *
            </label>
            <select
              id={`${idPrefix}-district`}
              name="district"
              value={form.district}
              onChange={set}
              onBlur={touch("district")}
              autoComplete="address-level1"
              aria-invalid={errFor("district") ? true : undefined}
              aria-describedby={`${idPrefix}-district-err`}
              className={inputCls}
            >
              <option value="">Оберіть область</option>
              {OBLASTS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <FieldError id={`${idPrefix}-district-err`}>{errFor("district")}</FieldError>
          </div>
          <TextField
            id={`${idPrefix}-city`}
            label="Населений пункт *"
            name="city"
            value={form.city}
            onChange={set}
            onBlur={touch("city")}
            error={errFor("city")}
            placeholder="Київ"
            autoComplete="address-level2"
          />
        </div>
      )}
      {quickRow}

      {courier ? (
        <div className="flex flex-col md:flex-row gap-4">
          {npOn ? (
            <Autocomplete
              id={`${idPrefix}-street`}
              label="Вулиця *"
              value={form.street}
              disabled={!form.settlementRef}
              placeholder={form.settlementRef ? "Почніть вводити назву вулиці" : "Спершу оберіть населений пункт"}
              error={errFor("street")}
              onBlur={touch("street")}
              onText={(t) => setForm({ ...form, street: t })}
              onPick={(st) => setForm({ ...form, street: st.name })}
              fetcher={fetchStreets}
            />
          ) : (
            <TextField
              id={`${idPrefix}-street`}
              label="Вулиця *"
              name="street"
              value={form.street}
              onChange={set}
              onBlur={touch("street")}
              error={errFor("street")}
              autoComplete="address-line1"
            />
          )}
          <div className="flex gap-4 md:w-[60%] shrink-0">
            <TextField
              id={`${idPrefix}-house`}
              label="Будинок *"
              name="house"
              value={form.house}
              onChange={set}
              onBlur={touch("house")}
              error={errFor("house")}
              autoComplete="off"
            />
            <TextField id={`${idPrefix}-flat`} label="Квартира" name="flat" value={form.flat} onChange={set} autoComplete="address-line2" />
          </div>
        </div>
      ) : npOn ? (
        <BranchPicker
          id={`${idPrefix}-warehouse`}
          label={postomat ? "Поштомат *" : "Відділення *"}
          value={form.warehouse}
          disabled={!form.cityRef}
          kind={postomat ? "postomat" : "warehouse"}
          onKind={(k) => chooseType(k === "postomat" ? "nova_poshta_postomat" : "nova_poshta_warehouse")}
          placeholder={form.cityRef ? "Введіть адресу або номер відділення" : "Спершу оберіть населений пункт"}
          error={errFor("warehouse")}
          onBlur={touch("warehouse")}
          onText={(t) => setForm({ ...form, warehouse: t, warehouseRef: "" })}
          onPick={(w) => setForm({ ...form, warehouse: w.title, warehouseRef: w.ref })}
          fetcher={fetchWarehouses}
        />
      ) : (
        <TextField
          id={`${idPrefix}-warehouse`}
          label={postomat ? "№ поштомата *" : "№ відділення *"}
          name="warehouse"
          value={form.warehouse}
          onChange={set}
          onBlur={touch("warehouse")}
          error={errFor("warehouse")}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Напр. 12"
        />
      )}
    </div>
  );
};

export default DeliveryFields;
