import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuTriangleAlert } from "react-icons/lu";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { get_return_policy } from "../store/reducers/returnSlice";
import { LegalH2, LegalLayout, LegalText, LegalToc } from "../utils/legalText";

const cell = "border border-(--line) px-3 py-2.5 align-top";

const Row = ({ label, cfg }) => (
  <tr className="even:bg-(--surface-2)">
    <th scope="row" className={`${cell} text-left font-medium text-(--ink)`}>
      {label}
    </th>
    <td className={cell}>
      {cfg.withdrawalAllowed ? `так, протягом ${cfg.withdrawalDays} дн. після отримання` : "не передбачено"}
    </td>
    <td className={cell}>{cfg.defectAllowed ? `так, протягом ${cfg.defectDays} дн.` : "не передбачено"}</td>
  </tr>
);

const prose = "max-w-[70ch] text-base leading-[1.65] text-(--ink)";

// Публічна сторінка «Обмін та повернення» — текст і строки повністю задає адмін
const ReturnsPolicy = () => {
  const dispatch = useDispatch();
  const policy = useSelector((s) => s.returns.policy);
  useEffect(() => {
    dispatch(get_return_policy());
  }, [dispatch]);

  const after = policy
    ? [
        { id: "rp-terms", text: "Строки повернення" },
        { id: "rp-refund", text: "Повернення коштів" },
        ...(policy.returnAddress ? [{ id: "rp-address", text: "Адреса для повернення товару" }] : []),
        ...(policy.contactInfo ? [{ id: "rp-contacts", text: "Контакти" }] : []),
      ]
    : [];

  return (
    <LegalLayout
      header={<Header />}
      footer={<Footer />}
      title="Обмін та повернення"
      toc={policy ? <LegalToc text={policy.policyText} idPrefix="rp" before={[{ id: "rp-text", text: "Загальні умови" }]} after={after} /> : null}
    >
      {!policy ? (
        <div aria-hidden="true" className="flex max-w-[70ch] flex-col gap-3 motion-safe:animate-pulse">
          {[90, 100, 80, 95].map((w, i) => (
            <div key={i} className="h-4 rounded-(--r-sm) bg-(--surface-2)" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {!policy.enabled && (
            <p
              role="status"
              className="flex max-w-[70ch] items-start gap-2 rounded-(--r-md) border border-(--line) border-l-4 border-l-(--warning) bg-(--surface) p-3 text-base text-(--ink)"
            >
              <LuTriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-(--warning)" />
              <span>Подання заявок онлайн тимчасово недоступне. Зверніться до підтримки.</span>
            </p>
          )}

          <section aria-labelledby="rp-text">
            <LegalH2 id="rp-text">Загальні умови</LegalH2>
            <div className="mt-3">
              <LegalText text={policy.policyText} idPrefix="rp" />
            </div>
          </section>

          <section aria-labelledby="rp-terms">
            <LegalH2 id="rp-terms">Строки повернення</LegalH2>
            <div
              className="mt-3 max-w-full overflow-x-auto overscroll-x-contain rounded-(--r-md) border border-(--line) bg-(--surface)"
              role="region"
              aria-label="Таблиця строків повернення"
              tabIndex={0}
            >
              <table className="w-full min-w-[520px] border-collapse text-sm leading-5 text-(--ink) md:text-base md:leading-6">
                <thead className="bg-(--surface-2)">
                  <tr>
                    <th scope="col" className={`${cell} text-left font-semibold`}>Покупець</th>
                    <th scope="col" className={`${cell} text-left font-semibold`}>Відмова від товару</th>
                    <th scope="col" className={`${cell} text-left font-semibold`}>Брак / невідповідність</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Фізична особа" cfg={policy.individual} />
                  <Row label="Юридична особа / ФОП" cfg={policy.company} />
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="rp-refund">
            <LegalH2 id="rp-refund">Повернення коштів</LegalH2>
            <p className={`mt-3 ${prose}`}>
              Повернення коштів — не пізніше <strong>{policy.refundDeadlineDays} днів</strong> з моменту звернення.
            </p>
          </section>

          {policy.returnAddress && (
            <section aria-labelledby="rp-address">
              <LegalH2 id="rp-address">Адреса для повернення товару</LegalH2>
              <p className={`mt-3 whitespace-pre-line break-words ${prose}`}>{policy.returnAddress}</p>
            </section>
          )}
          {policy.contactInfo && (
            <section aria-labelledby="rp-contacts">
              <LegalH2 id="rp-contacts">Контакти</LegalH2>
              <p className={`mt-3 whitespace-pre-line break-words ${prose}`}>{policy.contactInfo}</p>
            </section>
          )}
        </div>
      )}
    </LegalLayout>
  );
};

export default ReturnsPolicy;
