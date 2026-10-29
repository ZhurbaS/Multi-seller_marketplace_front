import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { fmtDate } from "../../utils/returnLabels";

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

  const box = "bg-[var(--bg-myOrders)] p-4 rounded-md text-[var(--text-myOrders)] flex flex-col gap-3";
  if (error) return <div className={box}>{error}</div>;
  if (!el) return null;
  if (!el.enabled) return <div className={box}>{el.message}</div>;

  if (el.canCancel) {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Скасування замовлення</h2>
        <p className="text-sm">
          Замовлення ще не передано в доставку — його можна скасувати. Якщо воно вже оплачене, кошти буде повернено
          тим самим способом оплати.
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Коментар (необов'язково)"
          className="border border-slate-300 rounded p-2 text-sm"
        />
        <button
          disabled={busy}
          onClick={() => submit({ reason: "cancel_unshipped", comment })}
          className="self-start px-4 py-2 bg-[var(--bg-card-processBtn)] text-[var(--text-card)] rounded disabled:opacity-50"
        >
          Подати заявку на скасування
        </button>
        <Link to={`/dashboard/order/details/${orderId}`} className="text-sm underline">
          Назад до замовлення
        </Link>
      </div>
    );
  }

  if (!el.canReturn) {
    return (
      <div className={box}>
        <p>{el.message || "Для цього замовлення повернення недоступне."}</p>
        <Link to={`/dashboard/order/details/${orderId}`} className="text-sm underline">
          Назад до замовлення
        </Link>
      </div>
    );
  }

  const needComment = reason === "defect" || reason === "wrong_item";
  return (
    <div className={box}>
      <h2 className="text-xl font-semibold">Повернення товару</h2>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm">Причина</label>
        {el.reasons.map((r) => (
          <label key={r.reason} className={`flex items-center gap-2 text-sm ${r.allowed ? "" : "opacity-50"}`}>
            <input type="radio" disabled={!r.allowed} checked={reason === r.reason} onChange={() => setReason(r.reason)} />
            {{ withdrawal: "Передумав / не підійшов", defect: "Брак / дефект", wrong_item: "Не той товар / некомплект" }[r.reason]}
            {r.allowed && r.until && <span className="opacity-60">(до {fmtDate(r.until)})</span>}
            {!r.allowed && <span className="opacity-60">(недоступно)</span>}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-semibold text-sm">Що повертаєте</label>
        {items.map((i) => {
          const blocked = reason === "withdrawal" && i.withdrawalBlocked;
          return (
            <div key={i.productId} className={`flex items-center gap-3 ${blocked ? "opacity-50" : ""}`}>
              {i.image && <img src={i.image} alt="" className="w-[45px] h-[45px] object-cover" />}
              <div className="flex-1 text-sm">
                {i.name} <span className="opacity-60">· ₴{i.unitPrice} / шт</span>
                {blocked && <div className="text-xs text-red-700">Цей товар не підлягає поверненню за бажанням покупця</div>}
              </div>
              <input
                type="number"
                min={0}
                max={i.availableQuantity}
                disabled={blocked}
                value={qty[i.productId] ?? ""}
                onChange={(e) =>
                  setQty({
                    ...qty,
                    [i.productId]: Math.max(0, Math.min(i.availableQuantity, Math.floor(Number(e.target.value) || 0))),
                  })
                }
                placeholder="0"
                className="w-16 border border-slate-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-xs opacity-60">з {i.availableQuantity}</span>
            </div>
          );
        })}
        <p className="text-sm">
          Орієнтовна вартість товарів: ₴{sum}. Остаточну суму повернення (з урахуванням знижок/купона) буде
          розраховано після перевірки товару.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold text-sm">Що робити з оплатою</label>
        <label className="text-sm flex items-center gap-2">
          <input type="radio" checked={resolution === "refund"} onChange={() => setResolution("refund")} /> Повернути кошти
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="radio" checked={resolution === "exchange"} onChange={() => setResolution("exchange")} /> Обміняти на інший
          товар (за наявності)
        </label>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder={needComment ? "Опишіть проблему (щонайменше 10 символів)" : "Коментар (необов'язково)"}
        className="border border-slate-300 rounded p-2 text-sm"
      />

      <button
        disabled={busy || !reason || !reasonRule?.allowed || selected.length === 0 || (needComment && comment.trim().length < 10)}
        onClick={() => submit({ reason, resolution, comment, items: selected })}
        className="self-start px-4 py-2 bg-[var(--bg-card-processBtn)] text-[var(--text-card)] rounded disabled:opacity-50"
      >
        Подати заявку
      </button>
      <p className="text-xs opacity-70">
        Після розгляду ми надішлемо вам на email адресу для відправлення. Товар має бути в незміненому стані та в комплекті.
      </p>
    </div>
  );
};

export default ReturnNew;
