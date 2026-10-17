import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, Home, LogOut, Menu, Share2, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth';
import { ErrorBox, Modal } from './UI';
export default function Layout() {
  const { userName, demo, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function exit() {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setError('از این دستگاه خارج شدید؛ ارتباط با سرور برای لغو نشست برقرار نشد.');
      navigate('/login');
    }
  }
  return (
    <div className="app-shell">
      {menu && (
        <button className="sidebar-scrim" aria-label="بستن منو" onClick={() => setMenu(false)} />
      )}
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <NavLink to="/" className="brand" onClick={() => setMenu(false)}>
          <img src="./assets/logo.png" alt="" />
          <span>
            مدیریت <b>۱۶۶۹</b>
            <small>سامانه خدمات و سفارش‌ها</small>
          </span>
        </NavLink>
        <div className="nav-label">فضای کاری</div>
        <nav>
          <NavLink to="/" end onClick={() => setMenu(false)}>
            <Home size={21} /> صفحه اصلی
          </NavLink>
          <NavLink to="/orders-report" onClick={() => setMenu(false)}>
            <ClipboardList size={21} /> گزارش عملیاتی
          </NavLink>
          <NavLink to="/referral" onClick={() => setMenu(false)}>
            <Share2 size={21} /> ارجاع سفارش‌ها
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">
              <UserRound size={21} />
            </span>
            <div>
              {userName || 'کاربر'}
              <small>{demo ? 'حالت نمایشی' : 'نشست فعال'}</small>
            </div>
          </div>
          <button className="logout" onClick={() => setConfirm(true)}>
            <LogOut size={19} /> خروج از حساب
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="icon-button menu-toggle"
              aria-label="باز کردن منو"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
            <span>پنل مدیریت خدمات</span>
          </div>
          <span className="date">
            {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long' }).format(new Date())}
          </span>
        </header>
        {demo && (
          <div className="demo-banner">
            حالت نمایشی — اطلاعات نمونه‌اند و هیچ درخواستی به API ارسال نمی‌شود.
            <button onClick={exit}>رفتن به ورود واقعی</button>
          </div>
        )}
        {error && <ErrorBox message={error} />}
        <main>
          <Outlet />
        </main>
        <footer className="footer">
          مدیریت ۱۶۶۹ <span>مدیریت ساده‌تر، خدمت‌رسانی بهتر</span>
        </footer>
      </div>
      {confirm && (
        <Modal title="خروج از حساب" onClose={() => setConfirm(false)}>
          <p>می‌خواهید از حساب خود خارج شوید؟</p>
          <div className="modal-actions">
            <button className="button danger" onClick={exit}>
              خروج
            </button>
            <button className="button secondary" onClick={() => setConfirm(false)}>
              انصراف
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
