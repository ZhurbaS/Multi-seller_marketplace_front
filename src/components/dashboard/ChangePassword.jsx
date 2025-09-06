import React from "react";

const ChangePassword = () => {
  return (
    <div className="p-4 bg-[var(--bg-changePas)]">
      <h2 className="text-xl text-[var(--text-changePas)] pb-5">
        Змінити пароль
      </h2>
      <form>
        <div className="flex flex-col gap-1 mb-2">
          <label for="old_password">Старий пароль</label>
          <input
            type="password"
            id="old_password"
            name="old_password"
            placeholder="Старий пароль"
            className="outline-none px-3 py-1 border border-[var(--border-changePas)] rounded-md text-[var(--text-changePas)]"
          />
        </div>

        <div className="flex flex-col gap-1 mb-2">
          <label for="new_password">Новий пароль</label>
          <input
            type="password"
            id="new_password"
            name="new_password"
            placeholder="Новий пароль"
            className="outline-none px-3 py-1 border border-[var(--border-changePas)] rounded-md text-[var(--text-changePas)]"
          />
        </div>

        <div className="flex flex-col gap-1 mb-2">
          <label for="confirm_password">Підтвердіть пароль</label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            placeholder="Підтвердіть пароль"
            className="outline-none px-3 py-1 border border-[var(--border-changePas)] rounded-md text-[var(--text-changePas)]"
          />
        </div>
        <div>
          <button className="px-8 py-2 bg-[var(--bg-changePasBtn)] shadow-lg hover:shadow-green-500/30 text-[var(--text-changePasBtn)] rounded-md">
            Зберегти зміни
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
