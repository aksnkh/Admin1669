import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, ArrowLeft, LockKeyhole, UserRound, LoaderCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { ErrorBox } from '../components/UI';
export default function Login() {
  const { authenticated, signIn, enterDemo } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (authenticated) return <Navigate to="/" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(name.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود انجام نشد.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <a className="brand" href="#/login">
          <img src="./assets/logo.png" alt="" />
          <span>
            مدیریت <b>۱۶۶۹</b>
          </span>
        </a>
        <div className="story-copy">
          <span className="eyebrow light">همراه شما در مسیر خدمت‌رسانی</span>
          <h1>
            همهٔ سفارش‌ها،
            <br />
            یک فضای منظم.
          </h1>
          <p>پیگیری سفارش‌ها، مشاهده گزارش‌های عملیاتی و دسترسی به تکنسین‌ها، در یک سامانه.</p>
          <img className="login-art" src="./assets/auth.png" alt="" />
        </div>
        <span className="story-footer">سامانه مدیریت خدمات ۱۶۶۹</span>
      </section>
      <section className="login-form-panel">
        <div className="login-card">
          <span className="login-symbol">
            <LockKeyhole size={26} />
          </span>
          <h2>خوش آمدید</h2>
          <p className="muted">برای ورود به پنل مدیریت، اطلاعات حساب خود را وارد کنید.</p>
          <form onSubmit={submit}>
            <label className="field">
              نام کاربری
              <div className="input-with-icon">
                <UserRound size={18} />
                <input
                  autoComplete="username"
                  dir="ltr"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام کاربری شما"
                />
              </div>
            </label>
            <label className="field">
              رمز ورود
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  autoComplete="current-password"
                  type={visible ? 'text' : 'password'}
                  dir="ltr"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور"
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={visible ? 'پنهان کردن رمز' : 'نمایش رمز'}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <ErrorBox message={error} />}
            <button
              className="button primary login-submit"
              disabled={busy || !name.trim() || !password}
            >
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  ورود به پنل <ArrowLeft size={18} />
                </>
              )}
            </button>
          </form>
          <div className="login-divider">
            <span>آشنایی با محیط سامانه</span>
          </div>
          <button
            type="button"
            className="button secondary full"
            disabled={busy}
            onClick={enterDemo}
          >
            مشاهده نسخه نمایشی
          </button>
          <p className="login-note">نسخه نمایشی از اطلاعات ساختگی استفاده می‌کند.</p>
        </div>
      </section>
    </div>
  );
}
