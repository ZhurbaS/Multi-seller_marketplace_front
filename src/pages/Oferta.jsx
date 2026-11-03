import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../api/api";
import { LegalText } from "../utils/legalText";

// Публічна оферта: видно лише після того, як адмін увімкне показ
const Oferta = () => {
  const [doc, setDoc] = useState(undefined);
  useEffect(() => {
    api
      .get("/home/legal/oferta")
      .then(({ data }) => setDoc(data))
      .catch(() => setDoc({ published: false }));
  }, []);

  return (
    <div>
      <Header />
      <section className="w-[85%] max-lg:w-[90%] mx-auto py-12 text-[var(--text-ship)] max-w-[900px]">
        {doc === undefined ? null : !doc.published ? (
          <>
            <h1 className="text-3xl font-bold mb-4">Сторінку не знайдено</h1>
            <p>Цей документ зараз недоступний.</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
            <p className="text-sm opacity-70 mb-6">Редакція № {doc.version}</p>
            <LegalText text={doc.text} />
          </>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Oferta;
