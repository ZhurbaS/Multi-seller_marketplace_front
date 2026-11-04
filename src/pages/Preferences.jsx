import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuCircleCheck } from "react-icons/lu";
import api from "../api/api";
import { useNoindex } from "../hooks/useMarketingConfig";
import { InlineConfirm, SubscriptionPanel } from "../components/dashboard/Subscriptions";
import { SubError, SubLoading, SubShell } from "./SubscribeConfirm";
import { btnDanger, fullMobile } from "../components/dashboard/ui";

// /preferences?t= — налаштування розсилки за токеном із листа (без входу в кабінет)
const Preferences = () => {
  useNoindex();
  const [params] = useSearchParams();
  const t = params.get("t") || "";
  const [state, setState] = useState(t ? "loading" : "error");
  const [data, setData] = useState(null);
  const [erase, setErase] = useState("idle"); // idle | ask | busy | done | error

  const load = useCallback(
    () =>
      api
        .get("/home/preferences", { params: { t } })
        .then(({ data: d }) => {
          setData({
            emailMasked: d?.email || "",
            name: d?.name || "",
            email: d?.channels?.email || { status: "none" },
            telegram: d?.channels?.telegram || { status: "none" },
            telegramLink: d?.telegramLink || null,
          });
          setState("ok");
        }),
    [t]
  );

  useEffect(() => {
    if (!t) return;
    load().catch(() => setState("error"));
  }, [t, load]);

  const save = async (payload) => {
    await api.put("/home/preferences", { t, ...payload });
    await load();
  };

  const doErase = async () => {
    setErase("busy");
    try {
      await api.post("/home/preferences/erase", { t });
      setErase("done");
    } catch {
      setErase("error");
    }
  };

  return (
    <SubShell>
      {state === "loading" && <SubLoading text="Завантажуємо налаштування…" />}
      {state === "error" && <SubError />}
      {state === "ok" && data && (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-[1.375rem] font-bold leading-7 md:text-[1.75rem] md:leading-9">Налаштування розсилки</h1>
            <p className="text-(--ink-2)">
              {data.name ? `${data.name}, оберіть` : "Оберіть"}, про що і як часто вам писати. Листи про замовлення це не змінює.
            </p>
          </div>

          <SubscriptionPanel data={data} save={save} variant="public" emailLabel={data.emailMasked} />

          {/* Видалення даних */}
          <section aria-labelledby="erase-h" className="flex flex-col gap-2 border-t border-(--line) pt-4">
            <h2 id="erase-h" className="font-semibold text-(--ink)">
              Видалити мої дані
            </h2>
            {erase === "done" ? (
              <p role="status" className="flex items-start gap-2 text-sm text-(--ink)">
                <LuCircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-(--success)" />
                Запит прийнято. Ми видалимо контактні дані з бази розсилок і повідомимо, коли все буде готово.
              </p>
            ) : (
              <>
                <p className="text-sm text-(--ink-2)">
                  Ми зупинимо всі розсилки й видалимо ваш e-mail, ім'я та історію підписки з бази розсилок. Дані про замовлення
                  зберігаються стільки, скільки цього вимагає закон.
                </p>
                {erase === "ask" || erase === "busy" ? (
                  <InlineConfirm
                    title="Надіслати запит на видалення даних?"
                    text="Скасувати це не вийде: щоб знову отримувати листи, доведеться підписатися заново."
                    confirmLabel="Так, видалити дані"
                    busy={erase === "busy"}
                    onCancel={() => setErase("idle")}
                    onConfirm={doErase}
                  />
                ) : (
                  <button type="button" onClick={() => setErase("ask")} className={`${btnDanger} ${fullMobile} self-start`}>
                    Видалити мої дані
                  </button>
                )}
                {erase === "error" && (
                  <p role="alert" className="text-sm text-(--danger)">
                    Не вдалося надіслати запит. Спробуйте ще раз трохи пізніше.
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </SubShell>
  );
};

export default Preferences;
