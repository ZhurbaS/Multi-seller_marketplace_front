import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuMinus, LuPlus, LuTrash2, LuX } from "react-icons/lu";
import {
  get_card_products,
  delete_card_product,
  quantity_inc,
  quantity_dec,
  messageClear,
} from "../store/reducers/cardSlice";
import { unitPrice } from "../utils/pricing";

// Вікно «Редагувати товари» поверх сторінки оформлення: фон розмитий, введені дані не втрачаються.
// Мобільні — bottom sheet, від md — центрована модалка.
// Два режими:
//  • кошик (за замовчуванням) — товари з Redux (state.card), зміни йдуть на сервер, після кожної — get_card_products;
//  • локальний (localItems + onLocalChange) — «Купити зараз» зі сторінки товару: товар НЕ лежить у кошику на сервері,
//    тож кількість/видалення змінюємо в стані сторінки оформлення (ціни для показу — utils/pricing, остаточні рахує сервер).
// onClose(empty) — empty=true лише коли товарів справді не лишилось.
const groupsTotal = (groups) =>
  groups.reduce((s, g) => s + g.products.reduce((a, pt) => a + (pt.lineTotal ?? (pt.unitPrice ?? 0) * pt.quantity), 0), 0);
const groupsQty = (groups) => groups.reduce((s, g) => s + g.products.reduce((a, pt) => a + pt.quantity, 0), 0);

const CartEditModal = ({ userId, onClose, localItems, onLocalChange }) => {
  const dispatch = useDispatch();
  const local = Array.isArray(localItems);
  const card = useSelector((s) => s.card);
  const [busy, setBusy] = useState(false);
  // У режимі кошика не показуємо «Кошик порожній», доки не прийшла свіжа відповідь сервера
  const [loaded, setLoaded] = useState(local);
  const dialogRef = useRef(null);

  const groups = local ? localItems : card.card_products || [];
  const sum = local ? groupsTotal(groups) : card.total ?? card.price;
  const count = local ? groupsQty(groups) : card.buy_product_item;

  const refresh = () => dispatch(get_card_products({ userId, coupon: true }));

  useEffect(() => {
    if (local) return;
    refresh().finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    const r = await dispatch(action);
    if (r.meta?.requestStatus === "rejected") toast.error(r.payload?.error || "Не вдалося виконати дію");
    dispatch(messageClear()); // повідомлення cardSlice тут не потрібні
    await refresh();
    setBusy(false);
  };

  // ---- локальний режим ----
  const updateLocal = (gi, pi, fn) => {
    const next = groups
      .map((g, i) => {
        if (i !== gi) return g;
        const products = g.products.map((pt, j) => (j === pi ? fn(pt) : pt)).filter(Boolean);
        return { ...g, products, price: groupsTotal([{ products }]) };
      })
      .filter((g) => g.products.length > 0);
    onLocalChange(next);
  };
  const changeLocalQty = (gi, pi, dir) =>
    updateLocal(gi, pi, (pt) => {
      const p = pt.productInfo;
      const step = Math.max(1, p.orderStep || 1);
      const min = Math.max(1, p.minOrderQty || 1);
      const q = pt.quantity + dir * step;
      if (q < min) {
        toast.error(`Мінімальне замовлення — ${min} шт`);
        return pt;
      }
      if (dir > 0 && !pt.preorder && p.stock > 0 && q > p.stock) {
        toast.error(`Доступно лише ${p.stock} шт`);
        return pt;
      }
      const unit = unitPrice(p, q);
      return { ...pt, quantity: q, unitPrice: unit, lineTotal: unit * q };
    });

  const removeItem = (gi, pi, pt) => (local ? updateLocal(gi, pi, () => null) : run(delete_card_product(pt._id)));
  const inc = (gi, pi, pt) => (local ? changeLocalQty(gi, pi, +1) : run(quantity_inc(pt._id)));
  const dec = (gi, pi, pt) => (local ? changeLocalQty(gi, pi, -1) : run(quantity_dec(pt._id)));

  const close = async () => {
    if (local) return onClose(groups.length === 0);
    const r = await refresh();
    const left = r.payload?.card_products || [];
    // Перенаправлення в кошик — лише якщо сервер підтвердив, що кошик порожній
    onClose(r.meta?.requestStatus === "fulfilled" && left.length === 0);
  };

  // Esc-обробник створюється один раз — тримаємо в ref актуальний close (локальні товари змінюються)
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    const prevFocus = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") return closeRef.current();
      // Утримуємо фокус у діалозі
      if (e.key === "Tab" && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll(
          'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("ts-sheet-open");
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("ts-sheet-open");
      if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
    };
  }, []);

  const iconBtn = "tap rounded-(--r-md) text-(--ink) hover:bg-(--surface-2) disabled:opacity-40";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-(--overlay) backdrop-blur-sm overscroll-contain"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-edit-title"
        tabIndex={-1}
        className="bg-(--surface) text-(--ink) w-full md:max-w-[640px] max-h-[85dvh] flex flex-col rounded-t-(--r-lg) md:rounded-(--r-lg) shadow-(--shadow-3) outline-none"
      >
        <div className="md:hidden flex justify-center pt-2" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-(--line-strong)" />
        </div>
        <div className="flex justify-between items-center pl-4 pr-2 py-2 border-b border-(--line)">
          <h2 id="cart-edit-title" className="text-lg font-bold">
            Редагувати товари
          </h2>
          <button type="button" onClick={close} aria-label="Закрити" className={iconBtn}>
            <LuX size={24} aria-hidden="true" />
          </button>
        </div>

        <ul className="overflow-y-auto overscroll-contain px-4 flex flex-col divide-y divide-(--line)">
          {!loaded && (
            <li className="py-6 text-center text-(--ink-2)" aria-live="polite">
              Завантаження...
            </li>
          )}
          {loaded &&
            groups.flatMap((g, gi) =>
            g.products.map((pt, pi) => (
              <li key={pt._id || pt.productInfo._id} className="flex gap-3 py-3">
                <img
                  className="shrink-0 w-16 h-16 rounded-(--r-md) bg-(--surface-2) object-contain"
                  src={pt.productInfo.images[0]}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                />
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="font-semibold leading-5 line-clamp-2">{pt.productInfo.name}</div>
                      <div className="price text-(--ink-2)">₴{pt.unitPrice ?? pt.productInfo.price} / шт</div>
                      {(pt.productInfo.minOrderQty > 1 || pt.productInfo.orderStep > 1) && (
                        <div className="text-xs text-(--ink-2)">
                          Мін. {pt.productInfo.minOrderQty || 1} шт
                          {pt.productInfo.orderStep > 1 ? `, крок ${pt.productInfo.orderStep}` : ""}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeItem(gi, pi, pt)}
                      aria-label={`Видалити: ${pt.productInfo.name}`}
                      className="tap -mr-2 -mt-2 rounded-(--r-md) text-(--danger) hover:bg-(--danger-soft) disabled:opacity-40"
                    >
                      <LuTrash2 size={20} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div
                      role="group"
                      aria-label="Кількість"
                      className="inline-flex items-center border border-(--line-strong) rounded-(--r-md)"
                    >
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => dec(gi, pi, pt)}
                        aria-label="Зменшити кількість"
                        className={iconBtn}
                      >
                        <LuMinus size={18} aria-hidden="true" />
                      </button>
                      <span className="min-w-10 text-center font-semibold tabular-nums" aria-live="polite">
                        {pt.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => inc(gi, pi, pt)}
                        aria-label="Збільшити кількість"
                        className={iconBtn}
                      >
                        <LuPlus size={18} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="price text-right font-semibold">₴{pt.lineTotal ?? (pt.unitPrice ?? 0) * pt.quantity}</div>
                  </div>
                </div>
              </li>
            ))
          )}
          {loaded && groups.length === 0 && <li className="py-6 text-center text-(--ink-2)">Кошик порожній</li>}
        </ul>

        <div
          className="px-4 pt-3 border-t border-(--line) flex justify-between items-center gap-3"
          style={{ paddingBottom: "max(12px, var(--sab))" }}
        >
          <div className="text-sm">
            Товарів: {count} · разом{" "}
            <span className="price font-bold text-base">₴{sum}</span>
          </div>
          <button
            type="button"
            onClick={close}
            className="h-12 px-6 rounded-(--r-md) bg-(--brand) hover:bg-(--brand-hover) text-(--on-brand) font-semibold"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartEditModal;
