import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  get_card_products,
  delete_card_product,
  quantity_inc,
  quantity_dec,
  messageClear,
} from "../store/reducers/cardSlice";

// Вікно «Редагувати товари» поверх сторінки оформлення: фон розмитий, введені дані не втрачаються.
const CartEditModal = ({ userId, onClose }) => {
  const dispatch = useDispatch();
  const { card_products, total, price, buy_product_item } = useSelector((s) => s.card);
  const [busy, setBusy] = useState(false);

  const refresh = () => dispatch(get_card_products({ userId, coupon: true }));

  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    const r = await dispatch(action);
    if (r.meta?.requestStatus === "rejected") toast.error(r.payload?.error || "Не вдалося виконати дію");
    dispatch(messageClear()); // повідомлення cardSlice тут не потрібні
    await refresh();
    setBusy(false);
  };

  const close = async () => {
    const r = await refresh();
    const left = r.payload?.card_products || [];
    onClose(r.meta?.requestStatus === "fulfilled" && left.length === 0);
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-[640px] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h2 className="text-lg font-bold">Редагувати товари</h2>
          <button onClick={close} aria-label="Закрити" className="text-2xl leading-none px-2 opacity-60 hover:opacity-100">
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-3 flex flex-col divide-y">
          {card_products.flatMap((g) =>
            g.products.map((pt) => (
              <div key={pt._id} className="flex gap-3 py-3 items-center">
                <img className="w-[64px] h-[64px] object-contain" src={pt.productInfo.images[0]} alt="" />
                <div className="flex-1 text-sm">
                  <div className="font-semibold leading-tight">{pt.productInfo.name}</div>
                  <div className="opacity-70">₴{pt.unitPrice} / шт</div>
                  {(pt.productInfo.minOrderQty > 1 || pt.productInfo.orderStep > 1) && (
                    <div className="text-xs opacity-60">
                      Мін. {pt.productInfo.minOrderQty || 1} шт{pt.productInfo.orderStep > 1 ? `, крок ${pt.productInfo.orderStep}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex items-center border rounded">
                  <button disabled={busy} onClick={() => run(quantity_dec(pt._id))} className="px-3 py-1 text-lg disabled:opacity-40">
                    −
                  </button>
                  <span className="px-2 min-w-[36px] text-center">{pt.quantity}</span>
                  <button disabled={busy} onClick={() => run(quantity_inc(pt._id))} className="px-3 py-1 text-lg disabled:opacity-40">
                    +
                  </button>
                </div>
                <div className="w-[84px] text-right font-semibold text-sm">₴{pt.lineTotal}</div>
                <button
                  disabled={busy}
                  onClick={() => run(delete_card_product(pt._id))}
                  aria-label="Видалити товар"
                  className="text-red-600 px-2 text-lg disabled:opacity-40"
                >
                  🗑
                </button>
              </div>
            ))
          )}
          {card_products.length === 0 && <p className="py-6 text-center opacity-70">Кошик порожній</p>}
        </div>

        <div className="px-5 py-4 border-t flex justify-between items-center">
          <div className="text-sm">
            Товарів: {buy_product_item} · разом <span className="font-bold text-base">₴{total ?? price}</span>
          </div>
          <button onClick={close} className="px-5 py-2 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)]">
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartEditModal;
