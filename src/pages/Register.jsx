import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { customer_register, messageClear } from '../store/reducers/authSlice';
import toast from 'react-hot-toast';
import { getFrontendUrl } from '../api/api'; // eslint-disable-line no-unused-vars
import GoogleButton from '../components/GoogleButton';
import ConsentCheckboxes from '../components/ConsentCheckboxes';
import {
  AuthButton,
  AuthCard,
  AuthField,
  ConsentBox,
  FieldError,
  OrDivider,
  PasswordField,
  SellerLinks,
} from '../components/OtpLogin';
import { consentRequired } from '../utils/consentRequired';
import useLegalStatus from '../hooks/useLegalStatus';
import useAuthConfig from '../hooks/useAuthConfig';

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
const CONSENT_MSG = 'Підтвердіть, що ознайомились з публічною офертою та політикою конфіденційності';

const Register = () => {
  const navigate = useNavigate();

  const { loader, errorMessage, successMessage, userInfo } = useSelector(
    (state) => state.auth
  );

  const [state, setState] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const dispatch = useDispatch();
  const legal = useLegalStatus();
  const authCfg = useAuthConfig();
  const [accept, setAccept] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [consentError, setConsentError] = useState('');
  const refs = { name: useRef(null), email: useRef(null), phone: useRef(null), password: useRef(null) };
  const consentRef = useRef(null);

  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (formError) setFormError('');
  };

  useEffect(() => {
    if (accept) setConsentError('');
  }, [accept]);

  const register = (e) => {
    e.preventDefault();
    const next = {};
    if (!state.name.trim()) next.name = "Вкажіть ім'я";
    if (!state.email.trim()) next.email = 'Вкажіть e-mail';
    else if (!isEmail(state.email)) next.email = 'Перевірте формат e-mail, наприклад name@gmail.com';
    const digits = state.phone.replace(/\D/g, '');
    if (!digits) next.phone = 'Вкажіть номер телефону';
    else if (digits.length < 10) next.phone = 'Номер має містити щонайменше 10 цифр';
    if (!state.password) next.password = 'Придумайте пароль';
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      refs[first]?.current?.focus();
      return;
    }
    if (consentRequired(legal) && !accept) {
      setConsentError(CONSENT_MSG);
      consentRef.current?.querySelector('input[type="checkbox"]')?.focus();
      return toast.error(CONSENT_MSG);
    }
    dispatch(customer_register({ ...state, acceptLegal: accept, marketing }));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      setFormError(errorMessage);
      dispatch(messageClear());
    }
    if (userInfo && !userInfo.guest) {
      navigate('/');
    }
  }, [successMessage, errorMessage, userInfo, dispatch, navigate]);

  // Згоди — одні на обидва способи (Google і форма); з Google стоять одразу під кнопкою
  const consent = (
    <div className="flex flex-col gap-1">
      <ConsentBox innerRef={consentRef}>
        <ConsentCheckboxes accept={accept} setAccept={setAccept} marketing={marketing} setMarketing={setMarketing} />
      </ConsentBox>
      <div role="alert">
        <FieldError id="register-consent-error">{consentError}</FieldError>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <AuthCard title="Реєстрація" subtitle="Створіть акаунт, щоб відстежувати замовлення та зберігати обране.">
        {authCfg.google && (
          <div className="flex flex-col gap-3">
            <GoogleButton clientId={authCfg.google.clientId} acceptLegal={accept} marketing={marketing} onDone={() => navigate('/')} />
            {consent}
          </div>
        )}

        {authCfg.google && <OrDivider>або через e-mail</OrDivider>}

        <form onSubmit={register} noValidate className="flex flex-col gap-4">
          <AuthField
            ref={refs.name}
            id="name"
            name="name"
            label="Ім'я"
            type="text"
            autoComplete="name"
            placeholder="Ваше ім'я"
            value={state.name}
            onChange={inputHandle}
            error={errors.name}
            required
          />
          <AuthField
            ref={refs.email}
            id="email"
            name="email"
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@gmail.com"
            value={state.email}
            onChange={inputHandle}
            error={errors.email}
            required
          />
          <AuthField
            ref={refs.phone}
            id="phone"
            name="phone"
            label="Номер телефону"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+380 XX XXX XX XX"
            value={state.phone}
            onChange={inputHandle}
            error={errors.phone}
            required
          />
          <PasswordField
            ref={refs.password}
            id="password"
            name="password"
            label="Пароль"
            autoComplete="new-password"
            placeholder="Придумайте пароль"
            value={state.password}
            onChange={inputHandle}
            error={errors.password}
            required
          />
          {!authCfg.google && consent}
          <div role="alert">
            <FieldError id="register-form-error">{formError}</FieldError>
          </div>
          <AuthButton
            type="submit"
            loading={loader}
            loadingText="Створюємо акаунт…"
            aria-describedby={[formError && 'register-form-error', consentError && 'register-consent-error'].filter(Boolean).join(' ') || undefined}
          >
            Зареєструватися
          </AuthButton>
        </form>

        <p className="text-center text-base text-(--ink-2)">
          Маєте акаунт?{' '}
          <Link to="/login" className="inline-flex min-h-11 items-center font-semibold text-(--brand-ink) hover:underline">
            Увійти
          </Link>
        </p>

        <SellerLinks />
      </AuthCard>
      <Footer />
    </div>
  );
};

export default Register;
