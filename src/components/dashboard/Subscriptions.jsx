import React, { useEffect, useId, useRef, useState } from "react";
import { LuCheck, LuCircleAlert, LuLoaderCircle, LuMail, LuSend } from "react-icons/lu";
import api from "../../api/api";
import { Badge } from "./Kit";
import { btnDanger, btnPrimary, btnSecondary, cardCls, fullMobile } from "./ui";
import useMarketingConfig, {
  DEFAULT_TOPICS,
  FALLBACK_CONSENT,
  FREQUENCIES,
  TOPICS,
  emailStatusLabel,
  telegramStatusLabel,
} from "../../hooks/useMarketingConfig";

/* ───────── Спільні елементи (також використовує сторінка /preferences) ───────── */

// Перемикач-рядок ≥44px: role="switch" + aria-checked, текстовий стан поруч
export const Switch = ({ checked, onChange, label, hint, disabled }) => {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={hint ? `${id}-h` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full min-h-14 items-center justify-between gap-3 rounded-(--r-md) px-3 py-2 text-left hover:bg-(--surface-2) disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-[15px] font-medium leading-5 text-(--ink)">{label}</span>
        {hint && (
          <span id={`${id}-h`} className="text-sm text-(--ink-2)">
            {hint}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-(--ink-2) xs:inline" aria-hidden="true">
          {checked ? "Увімк." : "Вимк."}
        </span>
        <span
          aria-hidden="true"
          className={`relative inline-flex h-7 w-12 items-center rounded-full border-2 motion-safe:transition-colors ${
            checked ? "border-(--brand) bg-(--brand)" : "border-(--line-strong) bg-(--surface-2)"
          }`}
        >
          <span
            className={`absolute size-5 rounded-full shadow-(--shadow-1) motion-safe:transition-transform ${
              checked ? "translate-x-[22px] bg-(--on-brand)" : "translate-x-[2px] bg-(--surface)"
            }`}
          />
        </span>
      </span>
    </button>
  );
};

export const TopicSwitches = ({ topics, onChange, disabled }) => (
  <fieldset className="flex flex-col gap-1" disabled={disabled}>
    <legend className="mb-1 text-sm font-semibold text-(--ink)">Про що писати</legend>
    {TOPICS.map((t) => (
      <Switch
        key={t.key}
        label={t.label}
        hint={t.hint}
        checked={!!topics?.[t.key]}
        disabled={disabled}
        onChange={(v) => onChange({ ...topics, [t.key]: v })}
      />
    ))}
  </fieldset>
);

export const FrequencyRadios = ({ value, onChange, disabled }) => {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-1 text-sm font-semibold text-(--ink)">Як часто</legend>
      {FREQUENCIES.map((f) => {
        const on = (value || "normal") === f.key;
        return (
          <label
            key={f.key}
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-(--r-md) border px-4 py-2 ${
              on ? "border-(--brand) bg-(--brand-soft)" : "border-(--line) bg-(--surface) hover:border-(--line-strong)"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={on}
              onChange={() => onChange(f.key)}
              className="size-5 shrink-0 cursor-pointer accent-(--brand)"
            />
            <span className="flex flex-col">
              <span className={`text-[15px] leading-5 text-(--ink) ${on ? "font-semibold" : "font-medium"}`}>{f.label}</span>
              <span className="text-sm text-(--ink-2)">{f.hint}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
};

// Вбудоване підтвердження небезпечної дії (замість window.confirm)
export const InlineConfirm = ({ title, text, confirmLabel, onConfirm, onCancel, busy }) => {
  const id = useId();
  const firstBtn = useRef(null);
  useEffect(() => {
    firstBtn.current?.focus();
  }, []);
  return (
    <div
      role="alertdialog"
      aria-labelledby={`${id}-t`}
      aria-describedby={`${id}-d`}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className="flex flex-col gap-3 rounded-(--r-md) border border-(--danger) bg-(--danger-soft) p-4"
    >
      <p id={`${id}-t`} className="font-semibold text-(--ink)">
        {title}
      </p>
      <p id={`${id}-d`} className="text-sm text-(--ink)">
        {text}
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button ref={firstBtn} type="button" onClick={onCancel} className={`${btnSecondary} ${fullMobile}`}>
          Скасувати
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={`${btnDanger} ${fullMobile}`}>
          {busy && <LuLoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};

const statusTone = (s) => (s === "subscribed" ? "success" : s === "pending" ? "brand" : s === "bounced" || s === "complained" ? "danger" : "neutral");

const sameTopics = (a = {}, b = {}) => TOPICS.every((t) => !!a[t.key] === !!b[t.key]);

/* ───────── Панель керування підпискою (кабінет і /preferences) ─────────
   data: { email:{status,topics,frequency}, telegram:{status,username}, telegramLink }
   save(payload) → Promise (кидає помилку з повідомленням); після збереження батько оновлює data.
   variant: 'account' — у кабінеті (непідписаним — форма зі згодою); 'public' — за токеном.  */
export const SubscriptionPanel = ({ data, save, variant = "account", emailLabel, children }) => {
  const { consentText } = useMarketingConfig();
  const st = data?.email?.status || "none";
  const active = st === "subscribed" || st === "pending";
  const [topics, setTopics] = useState(data?.email?.topics || DEFAULT_TOPICS);
  const [frequency, setFrequency] = useState(data?.email?.frequency || "normal");
  const [busy, setBusy] = useState("");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [ask, setAsk] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setTopics(data?.email?.topics || DEFAULT_TOPICS);
    setFrequency(data?.email?.frequency || "normal");
  }, [data]);

  const dirty = !sameTopics(topics, data?.email?.topics || DEFAULT_TOPICS) || frequency !== (data?.email?.frequency || "normal");
  const noTopic = !TOPICS.some((t) => topics[t.key]);

  const run = async (kind, payload, after) => {
    if (busy) return;
    setBusy(kind);
    setErr("");
    try {
      await save(payload);
      after?.();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Не вдалося зберегти. Спробуйте ще раз.");
    } finally {
      setBusy("");
    }
  };

  const tg = data?.telegram || {};
  const tgStatus = tg.status || "none";
  const showTg = !!data?.telegramLink || tgStatus !== "none";

  return (
    <div className="flex flex-col gap-4">
      {/* Статус e-mail */}
      <div className="flex flex-wrap items-center gap-2">
        <LuMail aria-hidden="true" className="size-5 text-(--ink-2)" />
        {emailLabel && <span className="break-all text-(--ink)">{emailLabel}</span>}
        <Badge tone={statusTone(st)}>{emailStatusLabel(st)}</Badge>
      </div>
      {st === "pending" && (
        <p className="text-sm text-(--ink-2)">Ми надіслали лист із посиланням — підтвердьте адресу, і розсилка запрацює.</p>
      )}

      {active ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!dirty || noTopic) return;
            run("save", { topics, frequency }, () => setSaved(true));
          }}
        >
          <TopicSwitches
            topics={topics}
            onChange={(v) => {
              setTopics(v);
              setSaved(false);
            }}
          />
          {noTopic && (
            <p className="flex items-start gap-1 text-sm text-(--ink-2)">
              <LuCircleAlert aria-hidden="true" className="mt-0.5 shrink-0" />
              Залиште хоча б одну тему або скористайтеся кнопкою «Відписатися від усіх розсилок» нижче.
            </p>
          )}
          <FrequencyRadios
            value={frequency}
            onChange={(v) => {
              setFrequency(v);
              setSaved(false);
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button type="submit" disabled={!dirty || noTopic || !!busy} className={`${btnPrimary} ${fullMobile} min-h-12`}>
              {busy === "save" && <LuLoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
              Зберегти
            </button>
            <p role="status" aria-live="polite" className="text-sm text-(--success)">
              {saved && !dirty && (
                <span className="inline-flex items-center gap-1">
                  <LuCheck aria-hidden="true" /> Збережено
                </span>
              )}
            </p>
          </div>
        </form>
      ) : variant === "public" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-(--ink-2)">
            {st === "unsubscribed"
              ? "Ми більше не надсилаємо вам рекламних листів. Листи про замовлення приходитимуть як і раніше."
              : st === "bounced" || st === "complained"
                ? "Розсилку на цю адресу вимкнено. Якщо це помилка — напишіть нам у підтримку."
                : "Ця адреса зараз не підписана на розсилку."}
          </p>
          {st === "unsubscribed" && (
            <button
              type="button"
              onClick={() => run("resub", { resubscribe: true })}
              disabled={!!busy}
              className={`${btnPrimary} ${fullMobile} min-h-12 self-start`}
            >
              {busy === "resub" && <LuLoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
              Повернути підписку
            </button>
          )}
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!consent || noTopic) return;
            run("sub", { subscribe: true, consent: true, topics, frequency });
          }}
        >
          <p className="text-sm text-(--ink-2)">
            {st === "unsubscribed"
              ? "Ви відписалися від розсилок. Якщо захочете повернутися — оберіть теми й підтвердьте згоду."
              : "Ви поки не отримуєте наших листів. Оберіть, що цікаво, — пишемо нечасто й по суті."}
          </p>
          <TopicSwitches topics={topics} onChange={setTopics} />
          <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-sm leading-5 text-(--ink)">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0 size-6 shrink-0 cursor-pointer accent-(--brand)"
            />
            <span className="pt-0.5">{consentText?.checkout || FALLBACK_CONSENT}</span>
          </label>
          <button type="submit" disabled={!consent || noTopic || !!busy} className={`${btnPrimary} ${fullMobile} min-h-12 self-start`}>
            {busy === "sub" && <LuLoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
            Підписатися
          </button>
        </form>
      )}

      {err && (
        <p role="alert" className="flex items-start gap-1 text-sm text-(--danger)">
          <LuCircleAlert aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{err}</span>
        </p>
      )}

      {/* Telegram */}
      {showTg && (
        <div className="flex flex-col gap-2 border-t border-(--line) pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <LuSend aria-hidden="true" className="size-5 text-(--ink-2)" />
            <span className="font-semibold text-(--ink)">Telegram</span>
            <Badge tone={tgStatus === "subscribed" ? "success" : tgStatus === "blocked" ? "danger" : "neutral"}>
              {telegramStatusLabel(tgStatus)}
            </Badge>
            {tgStatus === "subscribed" && tg.username && <span className="text-sm text-(--ink-2)">@{tg.username}</span>}
          </div>
          <p className="text-sm text-(--ink-2)">
            {tgStatus === "subscribed"
              ? "Короткі повідомлення про акції та новинки приходять у бот. Теми можна змінити командою /topics."
              : "Отримуйте короткі повідомлення про акції в Telegram — підключення займе кілька секунд."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {tgStatus !== "subscribed" && data?.telegramLink && (
              <a href={data.telegramLink} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} ${fullMobile}`}>
                <LuSend aria-hidden="true" /> Підключити Telegram
              </a>
            )}
            {tgStatus === "subscribed" && (
              <button
                type="button"
                onClick={() => run("tg", { channel: "telegram", unsubscribeAll: true })}
                disabled={!!busy}
                className={`${btnSecondary} ${fullMobile}`}
              >
                {busy === "tg" && <LuLoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
                Відключити Telegram
              </button>
            )}
          </div>
        </div>
      )}

      {/* Відписка від усього */}
      {active && (
        <div className="flex flex-col gap-2 border-t border-(--line) pt-4">
          {ask ? (
            <InlineConfirm
              title="Відписатися від усіх розсилок?"
              text="Ми перестанемо надсилати рекламні листи й повідомлення в Telegram. Листи про ваші замовлення приходитимуть як і раніше."
              confirmLabel="Так, відписатися"
              busy={busy === "unsub"}
              onCancel={() => setAsk(false)}
              onConfirm={() => run("unsub", { unsubscribeAll: true }, () => setAsk(false))}
            />
          ) : (
            <button type="button" onClick={() => setAsk(true)} className={`${btnDanger} ${fullMobile} self-start`}>
              Відписатися від усіх розсилок
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

/* ───────── Блок «Підписки» в налаштуваннях кабінету ───────── */
const Subscriptions = () => {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = () =>
    api
      .get("/home/customer/subscriptions")
      .then(({ data: d }) => {
        setData(d || {});
        setFailed(false);
      })
      .catch(() => setFailed(true));

  useEffect(() => {
    load();
  }, []);

  const save = async (payload) => {
    const { data: r } = await api.put("/home/customer/subscriptions", payload);
    if (r && r.email) setData(r);
    else await load();
  };

  return (
    <section className={`${cardCls} flex flex-col gap-3 p-4 md:p-5`} aria-labelledby="subs-h">
      <div>
        <h2 id="subs-h" className="text-lg font-semibold leading-6 text-(--ink)">
          Підписки
        </h2>
        <p className="text-sm text-(--ink-2)">Новини й пропозиції — лише ті, які вам цікаві.</p>
      </div>
      {failed ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-(--ink-2)">Не вдалося завантажити налаштування підписки.</p>
          <button type="button" onClick={load} className={`${btnSecondary} ${fullMobile} self-start`}>
            Спробувати ще раз
          </button>
        </div>
      ) : !data ? (
        <div aria-hidden="true" className="flex flex-col gap-2 motion-safe:animate-pulse">
          {[60, 100, 100, 80].map((w, i) => (
            <div key={i} className="h-10 rounded-(--r-sm) bg-(--surface-2)" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : (
        <SubscriptionPanel data={data} save={save} variant="account" />
      )}
    </section>
  );
};

export default Subscriptions;
