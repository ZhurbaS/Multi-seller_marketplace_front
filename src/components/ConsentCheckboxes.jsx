import React from "react";
import { Link } from "react-router-dom";
import useLegalStatus from "../hooks/useLegalStatus";

// Згода при реєстрації / гостьовому оформленні: обов'язкова (оферта + політика конфіденційності, коли їх опубліковано)
// й окрема необов'язкова — на розсилки (без попередньо поставленої галочки).
const ConsentCheckboxes = ({ accept, setAccept, marketing, setMarketing, showMarketing = true }) => {
  const legal = useLegalStatus();
  const hasOferta = !!legal.oferta?.published;
  const hasPrivacy = !!legal.privacy?.published;
  const required = hasOferta || hasPrivacy;
  return (
    <div className="flex flex-col gap-2 text-sm">
      {required && (
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" className="mt-1" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
          <span>
            Я ознайомився(лась){hasOferta && " з "}
            {hasOferta && (
              <Link to="/oferta" target="_blank" className="underline">
                Публічною офертою
              </Link>
            )}
            {hasOferta && hasPrivacy && " та "}
            {hasPrivacy && (
              <Link to="/privacy" target="_blank" className="underline">
                {hasOferta ? "Політикою конфіденційності" : "з Політикою конфіденційності"}
              </Link>
            )}{" "}
            і приймаю їх умови
          </span>
        </label>
      )}
      {showMarketing && (
        <label className="flex items-start gap-2 cursor-pointer opacity-90">
          <input type="checkbox" className="mt-1" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
          <span>Хочу отримувати новини та пропозиції на e-mail (необов'язково, відписатися можна будь-коли)</span>
        </label>
      )}
    </div>
  );
};

export default ConsentCheckboxes;
