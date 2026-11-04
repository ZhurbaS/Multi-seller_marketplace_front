import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { customer_login, messageClear } from '../store/reducers/authSlice';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { LuChevronDown } from 'react-icons/lu';
import { getFrontendUrl } from '../api/api'; // eslint-disable-line no-unused-vars
import OtpLogin, {
  AuthButton,
  AuthCard,
  AuthField,
  ConsentBox,
  FieldError,
  OrDivider,
  PasswordField,
  SellerLinks,
} from '../components/OtpLogin';
import GoogleButton from '../components/GoogleButton';
import ConsentCheckboxes from '../components/ConsentCheckboxes';
import useAuthConfig from '../hooks/useAuthConfig';

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

const Login = () => {
  const navigate = useNavigate();

  const { loader, errorMessage, successMessage, userInfo } = useSelector(
    (state) => state.auth
  );

  const dispatch = useDispatch();
  const authCfg = useAuthConfig();
  const [accept, setAccept] = useState(false);

  const [state, setState] = useState({
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  // Вхід з паролем: розгорнутий, якщо вхід за кодом вимкнено
  const [pwdOpen, setPwdOpen] = useState(false);
  const showPwd = pwdOpen || (authCfg.loaded && !authCfg.otp);
  const refs = { email: useRef(null), password: useRef(null) };

  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (formError) setFormError('');
  };

  const login = (e) => {
    e.preventDefault();
    const next = {};
    if (!state.email.trim()) next.email = 'Вкажіть e-mail';
    else if (!isEmail(state.email)) next.email = 'Перевірте формат e-mail, наприклад name@gmail.com';
    if (!state.password) next.password = 'Вкажіть пароль';
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      refs[first]?.current?.focus();
      return;
    }
    // console.log(state);
    dispatch(customer_login(state));
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
    // Гостьова сесія (кошик без реєстрації) — не вхід: сторінку входу не закриваємо
    if (userInfo && !userInfo.guest) {
      navigate('/');
    }
  }, [successMessage, errorMessage, userInfo, dispatch, navigate]);

  const hasQuick = !!authCfg.google || !!authCfg.otp;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <AuthCard title="Увійти" subtitle="Увійдіть, щоб бачити замовлення, обране та бонуси.">
        {authCfg.google && (
          <div className="flex flex-col gap-3">
            <GoogleButton clientId={authCfg.google.clientId} acceptLegal={accept} onDone={() => navigate('/')} />
            <ConsentBox>
              <ConsentCheckboxes accept={accept} setAccept={setAccept} showMarketing={false} />
            </ConsentBox>
          </div>
        )}

        {authCfg.google && authCfg.otp && <OrDivider />}

        {authCfg.otp && <OtpLogin onDone={() => navigate('/')} />}

        {hasQuick && <OrDivider>або з паролем</OrDivider>}

        {hasQuick && (
          <button
            type="button"
            onClick={() => setPwdOpen((v) => !v)}
            aria-expanded={showPwd}
            aria-controls="login-password-form"
            className="-mt-2 inline-flex min-h-11 items-center justify-center gap-2 self-center rounded-(--r-md) px-3 text-base font-medium text-(--brand-ink) hover:bg-(--brand-soft)"
          >
            Увійти з паролем
            <LuChevronDown
              aria-hidden="true"
              className={`size-5 motion-safe:transition-transform ${showPwd ? 'rotate-180' : ''}`}
            />
          </button>
        )}

        <form
          id="login-password-form"
          onSubmit={login}
          noValidate
          hidden={hasQuick && !showPwd}
          className={hasQuick && !showPwd ? 'hidden' : 'flex flex-col gap-4'}
        >
          <AuthField
            ref={refs.email}
            id="email"
            name="email"
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="name@gmail.com"
            value={state.email}
            onChange={inputHandle}
            error={errors.email}
            required
          />
          <AuthField
            id="phone"
            name="phone"
            label="Номер телефону"
            optional
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+380 XX XXX XX XX"
            value={state.phone}
            onChange={inputHandle}
          />
          <PasswordField
            ref={refs.password}
            id="password"
            name="password"
            label="Пароль"
            autoComplete="current-password"
            placeholder="Ваш пароль"
            value={state.password}
            onChange={inputHandle}
            error={errors.password}
            required
          />
          <div role="alert">
            <FieldError id="login-form-error">{formError}</FieldError>
          </div>
          <AuthButton type="submit" loading={loader} loadingText="Входимо…" aria-describedby={formError ? 'login-form-error' : undefined}>
            Увійти
          </AuthButton>
        </form>

        <p className="text-center text-base text-(--ink-2)">
          Не маєте акаунту?{' '}
          <Link to="/register" className="inline-flex min-h-11 items-center font-semibold text-(--brand-ink) hover:underline">
            Зареєструватися
          </Link>
        </p>

        <SellerLinks />
      </AuthCard>
      <Footer />
    </div>
  );
};

export default Login;
