import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { fmtDate } from "../../utils/returnLabels";
import { Field, PageHeader } from "./Kit";
import { btnPrimary, cardCls, fullMobile, inputCls, textareaCls } from "./ui";

// Форма заявки: скасування (до відправки) або повернення товару (після отримання)
const ReturnNew = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [el, setEl] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState("refund");
  const [comment, setComment] = useState("");
  const [qty, setQty] = useState({});

  useEffect(() => {
    api
      .get(`/home/returns/eligibility/${orderId}`)
      .then(({ data }) => {
        setEl(data.eligibility);
        const first = data.eligibility.reasons?.find((r) => r.allowed);
        if (first) setReason(first.reason);
      })
      .catch((e) => setError(e.response?.data?.error || "Не вдалося завантажити дані"));
  }, [orderId]);

  const reasonRule = useMemo(() => el?.reasons?.find((r) => r.reason === reason), [el, reason]);
  const items = (el?.items || []).filter((i) => i.availableQuantity > 0);
  const selected = items
    .filter((i) => Number(qty[i.productId]) > 0 && !(reason === "withdrawal" && i.withdrawalBlocked))
    .map((i) => ({ productId: i.productId, quantity: Number(qty[i.productId]) }));
  const sum = items.reduce((s, i) => s + (Number(qty[i.productId]) || 0) * (i.unitPrice || 0), 0);

  const submit = async (payload) => {
    setBusy(true);
    try {
      const { data } = await api.post("/home/returns", { orderId, ...payload });
      toast.success(data.message || "Заявку подано");
      navigate("/dashboard/returns");
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося подати заявку");
    } finally {
      setBusy(false);
    }
  };

  const backTo = `/dashboard/order/details/${orderId}`;
  const head = (title) => <PageHeader title={title} back={backTo} backLabel="До замовлення" />;
  const box = `${cardCls} p-4 md:p-5 text-(--ink) flex flex-col gap-4`;
  const setItemQty = (i, n) =>
    setQty({ ...qty, [i.productId]: Math.max(0, Math.min(i.availableQuantity, Math.floor(Number(n) || 0))) });

  if (error)
    return (
      <div className="flex flex-col gap-4">
        {head("Заявка")}
        <div className={box} role="alert">{error}</div>
      </div>
    );
  if (!el) return null;
  if (!el.enabled)
    return (
      <div className="flex flex-col gap-4">
        {head("Заявка")}
        <div className={box}>{el.message}</div>
      </div>
    );

  if (el.canCancel) {
    return (
      <div className="flex flex-col gap-4">
        {head("Скасування замовлення")}
        <div className={box}>
          <p className="text-[0.9375rem]">
            Замовлення ще не передано в доставку — його можна скасувати. Якщо воно вже оплачене, кошти буде повернено
            тим самим способом оплати.
          </p>
          <Field label="Коментар (необов'язково)">
            {(a) => (
              <textarea {...a} value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={2000} className={textareaCls} />
            )}
          </Field>
          <button
            type="button"
            disabled={busy}
            onClick={() => submit({ reason: "cancel_unshipped", comment })}
            className={`${btnPrimary} ${fullMobile} min-h-12 self-start`}
          >
            Подати заявку на скасування
          </button>
        </div>
      </div>
    );
  }

  if (!el.canReturn) {
    return (
      <div className="flex flex-col gap-4">
        {head("Повернення товару")}
        <div className={box}>
          <p>{el.message || "Для цього замовлення повернення недоступне."}</p>
        </div>
      </div>
    );
  }

  const needComment = reason === "defect" || reason === "wrong_item";
  const radioRow = "flex items-center gap-3 min-h-11 px-3 py-2 rounded-(--r-md) border text-[0.9375rem] cursor-pointer";
  return (
    <div className="flex flex-col gap-4">
      {head("Повернення товару")}
      <div className={box}>
        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold mb-2">Причина</legend>
          {el.reasons.map((r) => (
            <label
              key={r.reason}
              className={`${radioRow} ${reason === r.reason ? "border-(--brand) bg-(--brand-soft)" : "border-(--line)"} ${
                r.allowed ? "" : "opacity-60 cursor-not-allowed"
              }`}
            >
              <input
                type="radio"
                name="reason"
                className="w-5 h-5 shrink-0 accent-(--brand)"
                disabled={!r.allowed}
                checked={reason === r.reason}
                onChange={() => setReason(r.reason)}
              />
              <span className="min-w-0">
                {{ withdrawal: "Передумав / не підійшов", defect: "Брак / дефект", wrong_item: "Не той товар / некомплект" }[r.reason]}
                {r.allowed && r.until && <span className="text-sm text-(--ink-2)"> (до {fmtDate(r.until)})</span>}
                {!r.allowed && <span className="text-sm text-(--ink-2)"> (недоступно)</span>}
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold mb-2">Що повертаєте</legend>
          <ul className="flex flex-col gap-2">
            {items.map((i) => {
              const blocked = reason === "withdrawal" && i.withdrawalBlocked;
              const n = Number(qty[i.productId]) || 0;
              const on = n > 0 && !blocked;
              return (
                <li
                  key={i.productId}
                  className={`rounded-(--r-md) border p-2 ${on ? "border-(--brand) bg-(--brand-soft)" : "border-(--line)"} ${
                    blocked ? "opacity-60" : ""
                  }`}
                >
                  <label className={`flex items-center gap-3 min-h-11 ${blocked ? "cursor-not-allowed" : "cursor-pointer"}`}>
                    <span className="tap shrink-0 -m-1">
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-(--brand)"
                        disabled={blocked}
                        checked={on}
                        onChange={(e) => setItemQty(i, e.target.checked ? Math.max(1, n) : 0)}
                      />
                    </span>
                    {i.image && (
                      <img
                        src={i.image}
                        alt=""
                        width={48}
                        height={48}
                        loading="lazy"
                        className="w-12 h-12 shrink-0 object-contain rounded-(--r-sm) bg-(--surface)"
                      />
                    )}
                    <span className="flex-1 min-w-0 text-sm">
                      <span className="block font-medium line-clamp-2">{i.name}</span>
                      <span className="text-(--ink-2) price">₴{i.unitPrice} / шт · доступно {i.availableQuantity}</span>
                      {blocked && <span className="block text-xs text-(--danger)">Цей товар не підлягає поверненню за бажанням покупця</span>}
                    </span>
                  </label>
                  {on && i.availableQuantity > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <span className="text-sm text-(--ink-2) mr-auto pl-1">Кількість</span>
                      <button
                        type="button"
                        aria-label={`Зменшити кількість: ${i.name}`}
                        onClick={() => setItemQty(i, n - 1)}
                        className="tap rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-lg"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label={`Кількість: ${i.name}`}
                        min={0}
                        max={i.availableQuantity}
                        value={qty[i.productId] ?? ""}
                        onChange={(e) => setItemQty(i, e.target.value)}
                        className={`${inputCls} w-16 text-center px-1`}
                      />
                      <button
                        type="button"
                        aria-label={`Збільшити кількість: ${i.name}`}
                        disabled={n >= i.availableQuantity}
                        onClick={() => setItemQty(i, n + 1)}
                        className="tap rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-lg disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-(--ink-2)">
            Орієнтовна вартість товарів: <span className="price font-semibold text-(--ink)">₴{sum}</span>. Остаточну суму повернення (з урахуванням знижок/купона) буде
            розраховано після перевірки товару.
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold mb-2">Що робити з оплатою</legend>
          {[
            ["refund", "Повернути кошти"],
            ["exchange", "Обміняти на інший товар (за наявності)"],
          ].map(([v, t]) => (
            <label key={v} className={`${radioRow} ${resolution === v ? "border-(--brand) bg-(--brand-soft)" : "border-(--line)"}`}>
              <input
                type="radio"
                name="resolution"
                className="w-5 h-5 shrink-0 accent-(--brand)"
                checked={resolution === v}
                onChange={() => setResolution(v)}
              />
              {t}
            </label>
          ))}
        </fieldset>

        <Field
          label={needComment ? "Опишіть проблему" : "Коментар (необов'язково)"}
          required={needComment}
          hint={needComment ? "Щонайменше 10 символів" : undefined}
        >
          {(a) => <textarea {...a} value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={2000} className={textareaCls} />}
        </Field>

        <button
          type="button"
          disabled={busy || !reason || !reasonRule?.allowed || selected.length === 0 || (needComment && comment.trim().length < 10)}
          onClick={() => submit({ reason, resolution, comment, items: selected })}
          className={`${btnPrimary} ${fullMobile} min-h-12 self-start`}
        >
          Подати заявку
        </button>
        <p className="text-sm text-(--ink-2)">
          Після розгляду ми надішлемо вам на email адресу для відправлення. Товар має бути в незміненому стані та в комплекті.
        </p>
      </div>
    </div>
  );
};

export default ReturnNew;
