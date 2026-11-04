import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AiFillTikTok } from "react-icons/ai";
import { IoLogoFacebook } from "react-icons/io";
import { FaSquareInstagram, FaSquareYoutube } from "react-icons/fa6";
import { LuChevronDown, LuPhone, LuMail, LuMapPin } from "react-icons/lu";
import useLegalStatus from "../hooks/useLegalStatus";
import useStorefront from "../hooks/useStorefront";
import { openCookieSettings } from "../utils/consent";
import SubscribeForm from "./SubscribeForm";

const PHONE = "044 999 88 77";
const PHONE_HREF = "tel:+380449998877";
const EMAIL = "support@techscout.com";
const ADDRESS = "проспект Берестейський, буд. 50, оф. 10, м. Київ, 01001";

const socials = [
  { href: "#", label: "YouTube", Icon: FaSquareYoutube },
  { href: "#", label: "Facebook", Icon: IoLogoFacebook },
  { href: "#", label: "TikTok", Icon: AiFillTikTok },
  { href: "#", label: "Instagram", Icon: FaSquareInstagram },
];

const linkCls =
  "inline-flex items-center min-h-11 md:min-h-8 py-1 text-[15px] md:text-sm text-(--on-footer) hover:text-(--brand-ink) hover:underline text-left";

// Колонка: нижче md — акордеон, від md — завжди відкрита
const Section = ({ id, title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby={`${id}-h`} className="border-b border-(--line) md:border-0">
      <h2 id={`${id}-h`} className="text-base font-semibold text-(--ink)">
        <button
          type="button"
          className="md:hidden w-full min-h-12 flex items-center justify-between text-left"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {title}
          <LuChevronDown
            size={20}
            aria-hidden="true"
            className={`motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <span className="hidden md:block mb-3">{title}</span>
      </h2>
      <div id={id} className={`${open ? "block" : "hidden"} md:block pb-3 md:pb-0`}>
        {children}
      </div>
    </section>
  );
};

const Footer = () => {
  const legal = useLegalStatus();
  const { showStoresLink } = useStorefront();
  const { userInfo } = useSelector((state) => state.auth);
  const isAuthed = !!userInfo && !(userInfo.guest && !userInfo.email);

  return (
    <footer className="bg-(--footer-bg) text-(--on-footer)">
      <div className="container-x pt-8 md:pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[1.2fr_1fr_1fr_1.4fr] gap-0 md:gap-8">
          {/* Лого + коротко */}
          <div className="pb-4 md:pb-0 md:col-span-3 lg:col-span-1">
            <Link to="/" className="inline-flex min-h-11 items-center" aria-label="TechScout — на головну">
              <img className="h-12 w-auto" src="/images/logoTS.png" alt="Логотип TechScout" width="144" height="48" loading="lazy" />
            </Link>
            <p className="mt-2 text-sm max-w-[40ch]">
              Інтернет-магазин техніки та електроніки з доставкою по всій Україні.
            </p>
          </div>

          <Section id="ft-shop" title="Магазин">
            <ul className="flex flex-col">
              <li><Link to="/" className={linkCls}>Головна</Link></li>
              <li><Link to="/shops" className={linkCls}>Каталог товарів</Link></li>
              {showStoresLink && (
                <li><Link to="/stores" className={linkCls}>Магазини</Link></li>
              )}
              <li>
                <Link to={isAuthed ? "/dashboard" : "/login"} className={linkCls}>
                  {isAuthed ? "Мій кабінет" : "Вхід до кабінету"}
                </Link>
              </li>
            </ul>
          </Section>

          <Section id="ft-buyers" title="Покупцям">
            <ul className="flex flex-col">
              {legal.delivery?.published && (
                <li><Link to="/delivery" className={linkCls}>Доставка й оплата</Link></li>
              )}
              <li>
                <Link to={legal.returns?.published ? "/returns" : "/returns-policy"} className={linkCls}>
                  Обмін та повернення
                </Link>
              </li>
              {legal.warranty?.published && (
                <li><Link to="/warranty" className={linkCls}>Гарантія</Link></li>
              )}
              {legal.oferta?.published && (
                <li><Link to="/oferta" className={linkCls}>Публічна оферта</Link></li>
              )}
              {legal.privacy?.published && (
                <li><Link to="/privacy" className={linkCls}>Політика конфіденційності</Link></li>
              )}
              {legal.cookies?.published && (
                <li><Link to="/cookies" className={linkCls}>Політика cookies</Link></li>
              )}
              <li>
                <button type="button" onClick={openCookieSettings} className={linkCls}>
                  Налаштування cookies
                </button>
              </li>
            </ul>
          </Section>

          <Section id="ft-contacts" title="Контакти">
            <ul className="flex flex-col gap-1 text-[15px] md:text-sm">
              <li>
                <a href={PHONE_HREF} className="inline-flex items-center gap-2 min-h-11 md:min-h-8 hover:text-(--brand-ink)">
                  <LuPhone size={18} aria-hidden="true" /> {PHONE}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 min-h-11 md:min-h-8 hover:text-(--brand-ink) break-all">
                  <LuMail size={18} aria-hidden="true" /> {EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2 py-2">
                <LuMapPin size={18} aria-hidden="true" className="shrink-0 mt-0.5" />
                <span>{ADDRESS}</span>
              </li>
            </ul>
          </Section>

          {/* Підписка + соцмережі */}
          <div className="w-full min-w-0 pt-6 md:pt-0 md:col-span-3 lg:col-span-1">
            <h2 className="text-base font-semibold text-(--on-footer) mb-1">Підписуйтесь!</h2>
            <p className="text-sm mb-3">Акції, новинки й корисні поради — без спаму</p>
            <SubscribeForm source="footer" />
            <ul className="flex items-center gap-2 mt-4">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    className="w-11 h-11 inline-flex items-center justify-center rounded-full bg-(--surface) text-(--ink) border border-(--line) hover:bg-(--brand) hover:text-(--on-brand)"
                  >
                    <s.Icon size={20} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-(--line)">
        <div className="container-x py-4 text-center text-sm">
          © TechScout, {new Date().getFullYear()}. Всі права захищені
        </div>
      </div>
    </footer>
  );
};

export default Footer;
