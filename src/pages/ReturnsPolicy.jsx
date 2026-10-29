import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { get_return_policy } from "../store/reducers/returnSlice";

const Row = ({ label, cfg }) => (
  <tr>
    <td className="border px-3 py-2">{label}</td>
    <td className="border px-3 py-2">
      {cfg.withdrawalAllowed ? `так, протягом ${cfg.withdrawalDays} дн. після отримання` : "не передбачено"}
    </td>
    <td className="border px-3 py-2">{cfg.defectAllowed ? `так, протягом ${cfg.defectDays} дн.` : "не передбачено"}</td>
  </tr>
);

// Публічна сторінка «Обмін та повернення» — текст і строки повністю задає адмін
const ReturnsPolicy = () => {
  const dispatch = useDispatch();
  const policy = useSelector((s) => s.returns.policy);
  useEffect(() => {
    dispatch(get_return_policy());
  }, []);

  return (
    <div>
      <Header />
      <section className="w-[85%] max-lg:w-[90%] mx-auto py-12 text-[var(--text-ship)]">
        <h1 className="text-3xl font-bold mb-6">Обмін та повернення</h1>
        {!policy ? null : (
          <div className="flex flex-col gap-5">
            {!policy.enabled && (
              <p className="p-3 bg-yellow-50 text-yellow-800 rounded">
                Подання заявок онлайн тимчасово недоступне. Зверніться до підтримки.
              </p>
            )}
            <div className="whitespace-pre-line">{policy.policyText}</div>
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border px-3 py-2 text-left">Покупець</th>
                  <th className="border px-3 py-2 text-left">Відмова від товару</th>
                  <th className="border px-3 py-2 text-left">Брак / невідповідність</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Фізична особа" cfg={policy.individual} />
                <Row label="Юридична особа / ФОП" cfg={policy.company} />
              </tbody>
            </table>
            <p>Повернення коштів — не пізніше {policy.refundDeadlineDays} днів з моменту звернення.</p>
            {policy.returnAddress && (
              <div>
                <h2 className="font-semibold">Адреса для повернення товару</h2>
                <p className="whitespace-pre-line">{policy.returnAddress}</p>
              </div>
            )}
            {policy.contactInfo && (
              <div>
                <h2 className="font-semibold">Контакти</h2>
                <p className="whitespace-pre-line">{policy.contactInfo}</p>
              </div>
            )}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default ReturnsPolicy;
