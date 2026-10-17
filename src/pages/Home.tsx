import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Share2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth';
export default function Home() {
  const { userName, demo } = useAuth();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">پیشخوان</span>
          <h1>
            سلام، {userName || 'کاربر'} <span className="wave">☀</span>
          </h1>
          <p>به سامانه مدیریت خدمات ۱۶۶۹ خوش آمدید.</p>
        </div>
        <span className="status-chip">
          <span />
          {demo ? 'حالت نمایشی' : 'حساب واردشده'}
        </span>
      </div>
      <section className="welcome-banner">
        <div>
          <span className="eyebrow light">همه چیز در دسترس شماست</span>
          <h2>
            از سفارش تا خدمت،
            <br />
            با یک نگاه مدیریت کنید.
          </h2>
          <p>گزارش سفارش‌ها را بررسی کنید و تکنسین‌های تحت نظارت خود را ببینید.</p>
          <Link to="/orders-report" className="button white">
            مشاهده گزارش‌ها <ArrowLeft size={18} />
          </Link>
        </div>
        <div className="welcome-graphic">
          <ClipboardList size={116} strokeWidth={1} />
          <span className="graphic-tag">
            <ShieldCheck size={19} /> دسترسی با حساب کاربری
          </span>
        </div>
      </section>
      <div className="section-heading">
        <h2>دسترسی سریع</h2>
        <span>ابزارهای روزانه شما</span>
      </div>
      <div className="quick-grid">
        <Link className="quick-card" to="/orders-report">
          <div className="quick-icon">
            <img src="./assets/reports.png" alt="" />
          </div>
          <h3>گزارش عملیاتی</h3>
          <p>مشاهده، جست‌وجو و دریافت خروجی سفارش‌ها</p>
          <span>
            مشاهده گزارش <ArrowLeft size={17} />
          </span>
        </Link>
        <Link className="quick-card" to="/referral">
          <div className="quick-icon green">
            <img src="./assets/referral.png" alt="" />
          </div>
          <h3>ارجاع سفارش‌ها</h3>
          <p>جزئیات سفارش‌ها و فهرست تکنسین‌های شما</p>
          <span>
            مشاهده سفارش‌ها <ArrowLeft size={17} />
          </span>
        </Link>
      </div>
      <div className="hint-panel">
        <Share2 size={23} />
        <div>
          <strong>همهٔ اطلاعات در یک مسیر</strong>
          <p>
            فیلترهای گزارش را تنظیم کنید، جزئیات سفارش را ببینید و اطلاعات موردنیاز را دریافت کنید.
          </p>
        </div>
      </div>
    </>
  );
}
