import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../api/api";
import { LegalLayout, LegalText, LegalToc } from "../utils/legalText";

const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// Публічний юридичний документ (оферта, доставка й оплата, повернення, гарантія, конфіденційність, cookies):
// видно лише після того, як адмін увімкне показ.
const LegalPage = ({ slug }) => {
  const [doc, setDoc] = useState(undefined);
  useEffect(() => {
    setDoc(undefined);
    api
      .get(`/home/legal/${slug}`)
      .then(({ data }) => setDoc(data))
      .catch(() => setDoc({ published: false }));
  }, [slug]);

  if (doc === undefined) {
    return (
      <LegalLayout header={<Header />} footer={<Footer />} title={<span className="sr-only">Завантаження документа…</span>}>
        <div aria-hidden="true" className="flex max-w-[70ch] flex-col gap-3 motion-safe:animate-pulse">
          {[90, 100, 95, 70, 100, 85].map((w, i) => (
            <div key={i} className="h-4 rounded-(--r-sm) bg-(--surface-2)" style={{ width: `${w}%` }} />
          ))}
        </div>
      </LegalLayout>
    );
  }

  if (!doc.published) {
    return (
      <LegalLayout header={<Header />} footer={<Footer />} title="Сторінку не знайдено">
        <p className="max-w-[70ch] text-base leading-[1.65] text-(--ink-2)">Цей документ зараз недоступний.</p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-11 items-center rounded-(--r-md) bg-(--brand) px-4 font-semibold text-(--on-brand) hover:bg-(--brand-hover)"
        >
          На головну
        </Link>
      </LegalLayout>
    );
  }

  const date = fmtDate(doc.effectiveAt);
  return (
    <LegalLayout
      header={<Header />}
      footer={<Footer />}
      title={doc.title}
      meta={
        <>
          <span>Редакція № {doc.version}</span>
          {date && <span>Чинна з {date}</span>}
        </>
      }
      toc={<LegalToc text={doc.text} />}
    >
      <LegalText text={doc.text} />
    </LegalLayout>
  );
};

export default LegalPage;
