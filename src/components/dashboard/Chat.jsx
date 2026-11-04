import React, { useEffect, useRef, useState } from "react";
import { LuChevronLeft, LuMessagesSquare, LuPaperclip, LuSend, LuSmile } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useParams } from "react-router-dom";
import {
  add_friend,
  messageClear,
  send_message,
  updateMessage,
} from "../../store/reducers/chatSlice";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { getApiUrl } from "../../utils/apiRoutes";
import { PageHeader } from "./Kit";
import { cardCls } from "./ui";

const socket = io(getApiUrl(), {
  withCredentials: true,
  transports: ["websocket"],
}); // must be last

const Chat = () => {
  const scrollRef = useRef();
  const dispatch = useDispatch();
  const { sellerId } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const { my_friends, fd_messages, currentFd, successMessage } = useSelector(
    (state) => state.chat
  );

  const [text, setText] = useState("");
  const [receiverMessage, setReceiverMessage] = useState("");
  const [activeSeller, setActiveSeller] = useState([]);

  useEffect(() => {
    socket.emit("add_user", userInfo.id, userInfo);
  }, []);

  useEffect(() => {
    dispatch(
      add_friend({
        sellerId: sellerId || "",
        userId: userInfo.id,
      })
    );
  }, [sellerId, userInfo]);

  const send = () => {
    if (text) {
      dispatch(
        send_message({
          userId: userInfo.id,
          sellerId,
          text,
          name: userInfo.name,
        })
      );
      setText("");
    }
  };

  useEffect(() => {
    socket.on("seller_message", (msg) => setReceiverMessage(msg));
    socket.on("activeSeller", (sellers) => setActiveSeller(sellers));
  }, []);

  useEffect(() => {
    if (successMessage) {
      socket.emit("send_customer_message", fd_messages[fd_messages.length - 1]);
      dispatch(messageClear());
    }
  }, [successMessage]);

  useEffect(() => {
    if (receiverMessage) {
      if (
        sellerId === receiverMessage.senderId &&
        userInfo.id === receiverMessage.receiverId
      ) {
        dispatch(updateMessage(receiverMessage));
      } else {
        toast.success(
          receiverMessage.senderName + " " + " надіслав повідомлення"
        );
        dispatch(messageClear());
      }
    }
  }, [receiverMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [fd_messages]);

  // Мобільні (нижче lg): відкрита розмова — повноекранна, блокуємо скрол сторінки під нею
  useEffect(() => {
    if (!sellerId || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 1079.98px)");
    const root = document.documentElement;
    const apply = () => root.classList.toggle("ts-sheet-open", mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => {
      mq.removeEventListener?.("change", apply);
      root.classList.remove("ts-sheet-open");
    };
  }, [sellerId]);

  const isOnline = (id) => activeSeller.some((c) => c.sellerId === id);
  const Avatar = (f, size = "w-10 h-10") => (
    <span className={`relative shrink-0 ${size}`}>
      <img src={f.image} alt="" width={40} height={40} className="w-full h-full rounded-full object-cover bg-(--surface-2)" />
      {isOnline(f.fdId) && (
        <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-(--success) ring-2 ring-(--surface)" />
      )}
    </span>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className={sellerId ? "hidden lg:block" : ""}>
        <PageHeader title="Чат з продавцями" />
      </div>

      <div
        className={`${cardCls} overflow-hidden lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:h-[min(680px,calc(100dvh-var(--header-h)-140px))] lg:min-h-[420px]`}
      >
        {/* Список продавців: окремий екран на мобільних, ліва колонка від lg */}
        <aside
          aria-label="Продавці"
          className={`${sellerId ? "hidden lg:flex" : "flex"} flex-col min-h-0 lg:border-r lg:border-(--line)`}
        >
          <h2 className="flex items-center gap-2 px-4 min-h-14 font-semibold text-(--ink) border-b border-(--line)">
            <LuMessagesSquare aria-hidden="true" className="text-xl text-(--brand-ink)" />
            Повідомлення
          </h2>
          {my_friends.length === 0 ? (
            <p className="p-4 text-sm text-(--ink-2)">
              Розмов ще немає. Щоб задати питання продавцю, натисніть «Чат» на сторінці товару.
            </p>
          ) : (
            <ul className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1">
              {my_friends.map((f, i) => (
                <li key={i}>
                  <NavLink
                    to={`/dashboard/chat/${f.fdId}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 min-h-14 px-4 py-2 ${
                        isActive ? "bg-(--brand-soft) text-(--brand-ink) font-semibold" : "text-(--ink) hover:bg-(--surface-2)"
                      }`
                    }
                  >
                    {Avatar(f)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{f.name}</span>
                      <span className="block text-xs text-(--ink-2) font-normal">
                        {isOnline(f.fdId) ? "У мережі" : "Не в мережі"}
                      </span>
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Розмова: повноекранна на мобільних (100dvh), колонка від lg */}
        <section
          aria-label="Розмова"
          className={
            sellerId
              ? "fixed inset-0 z-[60] h-dvh flex flex-col bg-(--surface) lg:static lg:z-auto lg:h-full min-h-0"
              : "hidden lg:flex flex-col min-h-0"
          }
        >
          {currentFd && sellerId ? (
            <>
              <div className="flex items-center gap-2 pr-4 pl-1 lg:pl-4 min-h-14 pt-(--sat) lg:pt-0 border-b border-(--line) bg-(--surface)">
                <Link to="/dashboard/chat" aria-label="Назад до списку продавців" className="tap lg:hidden rounded-full text-(--ink) hover:bg-(--surface-2)">
                  <LuChevronLeft aria-hidden="true" className="text-2xl" />
                </Link>
                {Avatar(currentFd)}
                <div className="min-w-0">
                  <p className="font-semibold text-(--ink) truncate">{currentFd.name}</p>
                  <p className="text-xs text-(--ink-2)">{isOnline(currentFd.fdId) ? "У мережі" : "Не в мережі"}</p>
                </div>
              </div>

              <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-(--page) p-3 flex flex-col gap-3"
                role="log"
                aria-live="polite"
              >
                {fd_messages.length === 0 && (
                  <p className="m-auto text-sm text-(--ink-2) text-center">Напишіть перше повідомлення продавцю.</p>
                )}
                {fd_messages.map((m, i) =>
                  currentFd?.fdId !== m.receiverId ? (
                    <div ref={scrollRef} key={i} className="w-full flex gap-2 justify-start items-end">
                      <img className="w-8 h-8 rounded-full object-cover shrink-0" src={currentFd.image} alt="" width={32} height={32} />
                      <div className="max-w-[80%] px-3 py-2 rounded-(--r-lg) rounded-bl-(--r-sm) bg-(--surface) border border-(--line) text-(--ink) text-[0.9375rem] break-words whitespace-pre-wrap">
                        <span className="sr-only">{currentFd.name}: </span>
                        {m.message}
                      </div>
                    </div>
                  ) : (
                    <div ref={scrollRef} key={i} className="w-full flex gap-2 justify-end items-end">
                      <div className="max-w-[80%] px-3 py-2 rounded-(--r-lg) rounded-br-(--r-sm) bg-(--brand) text-(--on-brand) text-[0.9375rem] break-words whitespace-pre-wrap">
                        <span className="sr-only">Ви: </span>
                        {m.message}
                      </div>
                      <img className="w-8 h-8 rounded-full object-cover shrink-0" src="/images/user.png" alt="" width={32} height={32} />
                    </div>
                  )
                )}
              </div>

              {/* Поле введення: 48px, над safe-area */}
              <form
                className="flex items-center gap-2 px-2 pt-2 pb-[max(8px,var(--sab))] lg:pb-2 border-t border-(--line) bg-(--surface)"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <label htmlFor="chat-file" className="tap shrink-0 rounded-full text-(--ink-2) cursor-pointer hover:bg-(--surface-2)" aria-label="Додати файл">
                  <LuPaperclip aria-hidden="true" className="text-xl" />
                </label>
                <input id="chat-file" className="hidden" type="file" />
                <div className="relative flex-1 min-w-0">
                  <label htmlFor="chat-text" className="sr-only">
                    Повідомлення
                  </label>
                  <input
                    id="chat-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    type="text"
                    enterKeyHint="send"
                    autoComplete="off"
                    placeholder="Введіть повідомлення"
                    className="w-full h-12 pl-4 pr-10 rounded-full border border-(--line-strong) bg-(--surface) text-(--ink) outline-none focus:border-(--brand)"
                  />
                  <LuSmile aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-(--ink-2) pointer-events-none" />
                </div>
                <button
                  type="submit"
                  aria-label="Надіслати"
                  disabled={!text}
                  className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover) disabled:opacity-50"
                >
                  <LuSend aria-hidden="true" className="text-xl" />
                </button>
              </form>
            </>
          ) : sellerId ? (
            <>
              <div className="flex items-center gap-2 pl-1 min-h-14 pt-(--sat) lg:hidden border-b border-(--line)">
                <Link to="/dashboard/chat" aria-label="Назад до списку продавців" className="tap rounded-full text-(--ink)">
                  <LuChevronLeft aria-hidden="true" className="text-2xl" />
                </Link>
              </div>
              <p role="status" className="m-auto p-4 text-(--ink-2)">Завантаження розмови...</p>
            </>
          ) : (
            <div className="m-auto p-6 flex flex-col items-center gap-2 text-center text-(--ink-2)">
              <LuMessagesSquare aria-hidden="true" className="text-4xl" />
              <p className="font-semibold text-(--ink)">Щоб задати питання — оберіть продавця</p>
              <p className="text-sm">Список розмов — ліворуч.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Chat;
