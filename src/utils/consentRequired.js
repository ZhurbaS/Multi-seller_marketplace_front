// Чи потрібна згода при реєстрації: коли опубліковано оферту або політику конфіденційності
export const consentRequired = (legal) => !!(legal.oferta?.published || legal.privacy?.published);
