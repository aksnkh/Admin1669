import { useEffect, useState, type FormEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  ListFilter,
  RefreshCw,
  Search,
  Share2,
  ClipboardList,
  Phone,
  ArrowLeft,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../auth';
import { config } from '../api/client';
import { listOrders, listProvinces, listTechnicians, referOrder } from '../api/orders';
import { demoOrders, demoTechnicians } from '../demo';
import { emptyFilters, type OrderFilters, type Order, type Technician } from '../types';
import { columns, exportOrders } from '../csv';
import { ErrorBox, Loading, Modal, number } from '../components/UI';

const filterFields: { key: keyof OrderFilters; label: string; max?: number; numeric?: boolean }[] =
  [
    { key: 'ID', label: 'کد سفارش', numeric: true },
    { key: 'CustomerFamily', label: 'نام مشتری', max: 100 },
    { key: 'Mobile', label: 'شماره موبایل', max: 50 },
    { key: 'Tel', label: 'تلفن', max: 50 },
    { key: 'Date', label: 'تاریخ (۱۴۰۵/۰۷/۲۵)', max: 10 },
    { key: 'CustomerID', label: 'کد مشتری', numeric: true },
    { key: 'Ref', label: 'ارجاع به', max: 100 },
  ];
function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (c) => String(c.charCodeAt(0) - (c <= '٩' ? 1632 : 1776)));
}
function demoFilter(filters: OrderFilters) {
  return demoOrders.filter(
    (order) =>
      (!filters.ID || String(order.id) === filters.ID) &&
      (!filters.CustomerID || String(order.customerID) === filters.CustomerID) &&
      (order.customerFamily || '').includes(filters.CustomerFamily) &&
      (order.mobile || '').includes(filters.Mobile) &&
      (order.tel || '').includes(filters.Tel) &&
      (!filters.Date ||
        normalizeDigits(order.insertDate || '').includes(normalizeDigits(filters.Date))) &&
      (order.province || '').includes(filters.Province) &&
      (order.technician || '').includes(filters.Technician) &&
      (order.ref_tech || '').includes(filters.Ref),
  );
}
export default function Orders({ referral = false }: { referral?: boolean }) {
  const { demo } = useAuth();
  const [draft, setDraft] = useState<OrderFilters>({ ...emptyFilters });
  const [filters, setFilters] = useState<OrderFilters>({ ...emptyFilters });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [refresh, setRefresh] = useState(0);
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [lookupError, setLookupError] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [referring, setReferring] = useState<Order | null>(null);
  const [showTechs, setShowTechs] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setRows([]);
    const load = demo
      ? Promise.resolve(demoFilter(filters).slice((page - 1) * size, page * size))
      : listOrders(filters, page, size, controller.signal);
    load
      .then((data) => {
        if (!controller.signal.aborted) setRows(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'دریافت سفارش‌ها انجام نشد.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [demo, filters, page, size, refresh]);
  useEffect(() => {
    if (demo) {
      setTechnicians(demoTechnicians);
      setProvinces(['تهران', 'البرز']);
      return;
    }
    const controller = new AbortController();
    setLookupError('');
    Promise.allSettled([listTechnicians(controller.signal), listProvinces(controller.signal)]).then(
      ([techs, provs]) => {
        if (controller.signal.aborted) return;
        if (techs.status === 'fulfilled') setTechnicians(techs.value);
        if (provs.status === 'fulfilled')
          setProvinces(provs.value.flatMap((p) => (p.prvName ? [p.prvName] : [])));
        if (techs.status === 'rejected' || provs.status === 'rejected')
          setLookupError(
            'دریافت بخشی از فهرست‌های کمکی انجام نشد. فیلترهای متنی همچنان قابل استفاده‌اند.',
          );
      },
    );
    return () => controller.abort();
  }, [demo, refresh]);
  const active = Object.values(filters).filter(Boolean).length;
  function apply(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draft });
  }
  function reset() {
    setDraft({ ...emptyFilters });
    setFilters({ ...emptyFilters });
    setPage(1);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">مدیریت سفارش‌ها</span>
          <h1>{referral ? 'ارجاع سفارش‌ها' : 'گزارش عملیاتی'}</h1>
          <p>
            {referral
              ? 'جزئیات سفارش‌ها و تکنسین‌های تحت نظارت شما'
              : 'سفارش‌ها را جست‌وجو کنید، جزئیات را ببینید و گزارش بگیرید.'}
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary"
            onClick={() => setRefresh((v) => v + 1)}
            disabled={loading}
            aria-label="به‌روزرسانی"
          >
            <RefreshCw size={17} className={loading ? 'spin' : ''} />
            <span>به‌روزرسانی</span>
          </button>
          {!referral && (
            <button
              className="button primary"
              disabled={!rows.length || loading}
              onClick={() => exportOrders(rows)}
            >
              <Download size={17} /> خروجی صفحه
            </button>
          )}
          {referral && (
            <button className="button primary" onClick={() => setShowTechs(true)}>
              <UsersRound size={18} /> تکنسین‌ها
            </button>
          )}
        </div>
      </div>
      {notice && (
        <div className="success-banner" role="status">
          {notice}
        </div>
      )}
      {referral && !config.referralEndpoint && (
        <div className="info-banner">
          <Share2 size={19} />
          <span>
            مشاهده سفارش‌ها و تکنسین‌ها فعال است. ثبت نهایی ارجاع پس از اتصال سرویس مربوطه فعال
            می‌شود.
          </span>
        </div>
      )}
      <section className="panel filters-panel">
        <button
          className="filter-heading"
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
        >
          <span>
            <ListFilter size={20} /> فیلتر سفارش‌ها{' '}
            {active > 0 && <b className="count-badge">{number(active)}</b>}
          </span>
          <ChevronLeft size={18} className={showFilters ? 'rotate' : ''} />
        </button>
        {showFilters && (
          <form onSubmit={apply}>
            <div className="filter-grid">
              {filterFields.map((field) => (
                <label className="field" key={field.key}>
                  {field.label}
                  <input
                    inputMode={field.numeric ? 'numeric' : undefined}
                    maxLength={field.max}
                    value={draft[field.key]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        [field.key]: field.numeric
                          ? normalizeDigits(e.target.value)
                          : e.target.value,
                      })
                    }
                    placeholder={field.numeric ? 'مثلاً ۱۶۶۹۰۱' : 'همه'}
                  />
                </label>
              ))}
              <label className="field">
                استان
                <input
                  list="provinces"
                  maxLength={100}
                  value={draft.Province}
                  placeholder="همه استان‌ها"
                  onChange={(e) => setDraft({ ...draft, Province: e.target.value })}
                />
                <datalist id="provinces">
                  {provinces.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </label>
              <label className="field">
                تکنسین
                <input
                  list="technicians"
                  maxLength={100}
                  value={draft.Technician}
                  placeholder="همه تکنسین‌ها"
                  onChange={(e) => setDraft({ ...draft, Technician: e.target.value })}
                />
                <datalist id="technicians">
                  {technicians.map((t) => (
                    <option key={t.tchId} value={t.fullName || ''} />
                  ))}
                </datalist>
              </label>
            </div>
            <div className="filter-footer">
              <span>
                {active
                  ? `${number(active)} فیلتر فعال است`
                  : 'برای نمایش همه سفارش‌ها، فیلترها را خالی بگذارید.'}
              </span>
              <div>
                <button className="button text" type="button" onClick={reset}>
                  حذف فیلترها
                </button>
                <button className="button primary" type="submit">
                  <Search size={17} /> جست‌وجو
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
      {lookupError && (
        <p className="lookup-note" role="status">
          {lookupError}
        </p>
      )}
      <section className="panel orders-panel">
        <div className="section-heading table-heading">
          <h2>
            <ClipboardList size={20} /> {referral ? 'سفارش‌های قابل مشاهده' : 'فهرست سفارش‌ها'}{' '}
            <span className="count-badge">{loading ? '…' : number(rows.length)}</span>
          </h2>
          <label className="page-size">
            تعداد در صفحه
            <select
              aria-label="تعداد در صفحه"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>۱۰</option>
              <option value={25}>۲۵</option>
              <option value={50}>۵۰</option>
              <option value={100}>۱۰۰</option>
            </select>
          </label>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="state-area">
            <ErrorBox message={error} />
            <button className="button secondary" onClick={() => setRefresh((v) => v + 1)}>
              تلاش دوباره
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <Filter size={35} />
            <h3>سفارشی پیدا نشد</h3>
            <p>فیلترها را تغییر دهید یا صفحهٔ قبلی را بررسی کنید.</p>
            <button className="button secondary" onClick={reset}>
              نمایش همه سفارش‌ها
            </button>
          </div>
        ) : referral ? (
          <div className="order-card-list">
            {rows.map((row) => (
              <OrderCard
                key={row.id}
                order={row}
                onDetail={() => setDetail(row)}
                onRefer={() => setReferring(row)}
              />
            ))}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>کد سفارش</th>
                  <th>مشتری</th>
                  <th>دستگاه / برند</th>
                  <th>ایراد</th>
                  <th>مکان</th>
                  <th>تاریخ ثبت</th>
                  <th>ارجاع به</th>
                  <th>جزئیات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="order-id">{number(row.id)}</td>
                    <td>
                      <strong>{row.customerFamily || '—'}</strong>
                      <small dir="ltr">{row.mobile || '—'}</small>
                    </td>
                    <td>
                      {row.mashine || '—'}
                      <small>{row.brand || '—'}</small>
                    </td>
                    <td>{row.error || '—'}</td>
                    <td>
                      {row.city || row.province || '—'}
                      <small>{row.region || '—'}</small>
                    </td>
                    <td className="nowrap">{row.insertDate || '—'}</td>
                    <td>
                      <span className={`tag ${row.ref_tech ? 'assigned' : 'pending'}`}>
                        {row.ref_tech || 'ارجاع نشده'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`جزئیات سفارش ${row.id}`}
                        onClick={() => setDetail(row)}
                      >
                        <ArrowLeft size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>
            صفحه {number(page)}{' '}
            <span className="muted">· {number(rows.length)} سفارش در این صفحه</span>
          </span>
          <div>
            <button
              className="button secondary compact"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronRight size={17} /> قبلی
            </button>
            <button
              className="button secondary compact"
              disabled={rows.length < size || loading || !!error}
              onClick={() => setPage((p) => p + 1)}
            >
              بعدی <ChevronLeft size={17} />
            </button>
          </div>
        </div>
      </section>
      {detail && (
        <Modal title={`جزئیات سفارش ${number(detail.id)}`} onClose={() => setDetail(null)}>
          <dl className="detail-grid">
            {columns.map((c) => (
              <div key={c.key}>
                <dt>{c.label}</dt>
                <dd>
                  {detail[c.key] == null || detail[c.key] === '' ? '—' : String(detail[c.key])}
                </dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
      {showTechs && (
        <Modal title="لیست تکنسین‌ها" onClose={() => setShowTechs(false)}>
          <TechnicianList technicians={technicians} />
          {lookupError && <ErrorBox message={lookupError} />}
        </Modal>
      )}
      {referring && (
        <ReferralModal
          order={referring}
          technicians={technicians}
          demo={demo}
          onClose={() => setReferring(null)}
          onSuccess={() => {
            setReferring(null);
            setNotice('ارجاع با موفقیت ثبت شد.');
            setRefresh((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
function TechnicianList({ technicians }: { technicians: Technician[] }) {
  return technicians.length ? (
    <ul className="technician-list">
      {technicians.map((t) => (
        <li key={t.tchId}>
          <span className="avatar">
            <UsersRound size={19} />
          </span>
          <span>
            {t.fullName || 'بدون نام'}
            <small>کد {number(t.tchId)}</small>
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="muted">تکنسینی دریافت نشده است.</p>
  );
}
function OrderCard({
  order,
  onDetail,
  onRefer,
}: {
  order: Order;
  onDetail: () => void;
  onRefer: () => void;
}) {
  return (
    <article className="order-card">
      <div className="order-card-top">
        <span className="order-id">#{number(order.id)}</span>
        <span className={`tag ${order.ref_tech ? 'assigned' : 'pending'}`}>
          {order.ref_tech ? 'ارجاع شده' : 'در انتظار ارجاع'}
        </span>
      </div>
      <h3>
        {order.mashine} <span>· {order.brand}</span>
      </h3>
      <p>{order.error || 'بدون توضیح ایراد'}</p>
      <div className="card-info">
        <span>
          مشتری<strong>{order.customerFamily || '—'}</strong>
        </span>
        <span>
          مکان<strong>{[order.city, order.region].filter(Boolean).join('، ') || '—'}</strong>
        </span>
        <span>
          ارجاع به<strong>{order.ref_tech || '—'}</strong>
        </span>
        <span>
          تاریخ ثبت<strong>{order.insertDate || '—'}</strong>
        </span>
      </div>
      <div className="card-actions">
        <button className="button secondary" onClick={onDetail}>
          جزئیات
        </button>
        {order.mobile && /^[+\d\s()-]+$/.test(order.mobile) && (
          <a className="icon-button" href={`tel:${order.mobile}`} aria-label="تماس با مشتری">
            <Phone size={18} />
          </a>
        )}
        <button className="button primary" onClick={onRefer}>
          <Share2 size={16} /> ارجاع
        </button>
      </div>
    </article>
  );
}
function ReferralModal({
  order,
  technicians,
  demo,
  onClose,
  onSuccess,
}: {
  order: Order;
  technicians: Technician[];
  demo: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const enabled = !!config.referralEndpoint && !demo;
  async function submit() {
    setBusy(true);
    setError('');
    try {
      await referOrder(order.id, selected);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارجاع ثبت نشد.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`ارجاع سفارش ${number(order.id)}`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="muted">تکنسین موردنظر را از فهرست زیر انتخاب کنید.</p>
      <label className="field">
        تکنسین
        <select
          aria-label="تکنسین"
          value={selected}
          disabled={busy}
          onChange={(e) => {
            setSelected(e.target.value);
            setConfirm(false);
          }}
        >
          <option value="">انتخاب تکنسین</option>
          {technicians
            .filter((t) => t.fullName)
            .map((t) => (
              <option key={t.tchId} value={t.fullName!}>
                {t.fullName}
              </option>
            ))}
        </select>
      </label>
      {!enabled && (
        <div className="info-banner">
          {demo
            ? 'ثبت ارجاع در حالت نمایشی انجام نمی‌شود.'
            : 'سرویس ثبت ارجاع هنوز به API اضافه نشده است.'}
        </div>
      )}
      {confirm && <p>آیا از ارجاع سفارش به «{selected}» مطمئن هستید؟</p>}
      {error && <ErrorBox message={error} />}
      <div className="modal-actions">
        <button
          className="button primary"
          disabled={!enabled || !selected || busy}
          onClick={() => (confirm ? submit() : setConfirm(true))}
        >
          {busy ? 'در حال ثبت…' : confirm ? 'تأیید نهایی' : 'ثبت ارجاع'}
        </button>
        <button className="button secondary" disabled={busy} onClick={onClose}>
          انصراف
        </button>
      </div>
    </Modal>
  );
}
