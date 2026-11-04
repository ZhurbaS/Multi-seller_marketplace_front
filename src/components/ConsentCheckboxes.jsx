import React from "react";
import { Link } from "react-router-dom";
import useLegalStatus from "../hooks/useLegalStatus";
import { Checkbox } from "./CheckoutUi";
import useMarketingConfig from "../hooks/useMarketingConfig";

// Згода при реєстрації / гостьовому оформленні: обов'язкова (оферта + політика конфіденційності, коли їх опубліковано)
// й окрема необов'язкова — на розсилки (без попередньо поставленої галочки).
const ConsentCheckboxes = ({ accept, setAccept, marketing, setMarketing, showMarketing = true }) => {
  const legal = useLegalStatus();
  const { consentText } = useMarketingConfig();
  const hasOferta = !!legal.oferta?.published;
  const hasPrivacy = !!legal.privacy?.published;
  const required = hasOferta || hasPrivacy;
  return (
    <div className="flex flex-col gap-1 text-sm">
      {required && (
        <Checkbox checked={accept} onChange={(e) => setAccept(e.target.checked)}>
          <span>
            Я ознайомився(лась){hasOferta && " з "}
            {hasOferta && (
              <Link to="/oferta" target="_blank" className="underline underline-offset-2 text-(--brand-ink) font-medium">
                Публічною офертою
              </Link>
            )}
            {hasOferta && hasPrivacy && " та "}
            {hasPrivacy && (
              <Link to="/privacy" target="_blank" className="underline underline-offset-2 text-(--brand-ink) font-medium">
                {hasOferta ? "Політикою конфіденційності" : "з Політикою конфіденційності"}
              </Link>
            )}{" "}
            і приймаю їх умови
          </span>
        </Checkbox>
      )}
      {showMarketing && (
        <Checkbox checked={!!marketing} onChange={(e) => setMarketing(e.target.checked)}>
          <span className="text-(--ink-2)">
            {consentText?.checkout || "Хочу отримувати новини та пропозиції на e-mail (необов'язково, відписатися можна будь-коли)"}
          </span>
        </Checkbox>
      )}
    </div>
  );
};

export default ConsentCheckboxes;
