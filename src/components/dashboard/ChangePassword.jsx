import React from "react";
import { Field, PageHeader } from "./Kit";
import { btnPrimary, cardCls, fullMobile, inputCls } from "./ui";

const ChangePassword = () => {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Змінити пароль" />
      <form
        className={`${cardCls} p-4 md:p-5 flex flex-col gap-4 md:max-w-[480px]`}
        // Не відправляємо форму GET-запитом (пароль у URL)
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Підказка менеджерам паролів, для якого акаунта зміна */}
        <input type="email" name="username" autoComplete="username" hidden readOnly />
        <Field label="Старий пароль">
          {(a) => (
            <input {...a} type="password" name="old_password" autoComplete="current-password" className={inputCls} />
          )}
        </Field>
        <Field label="Новий пароль">
          {(a) => <input {...a} type="password" name="new_password" autoComplete="new-password" className={inputCls} />}
        </Field>
        <Field label="Підтвердіть пароль">
          {(a) => (
            <input {...a} type="password" name="confirm_password" autoComplete="new-password" className={inputCls} />
          )}
        </Field>
        <button type="submit" className={`${btnPrimary} ${fullMobile} min-h-12 self-start`}>
          Зберегти зміни
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
