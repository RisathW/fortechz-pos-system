// Shared UI kit — Fortechz design (Figma "POS System Web UI"): navy surfaces, vivid blue accent.
import React, { useEffect, useRef } from 'react';

// Close overlays with the Escape key (only when they offer a close action).
function useEscape(onClose) {
  const ref = useRef(onClose);
  useEffect(() => { ref.current = onClose; });
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && ref.current) ref.current(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
}
import { Search, X } from 'lucide-react';
import logo from './assets/logo.png';
import logoDark from './assets/logo02.png';

export const cx = (...c) => c.filter(Boolean).join(' ');

export const money = (n) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Logo PNGs have large built-in padding; crop it so the mark reads at sidebar size.
export function Logo({ isDarkMode, className = 'w-48 h-11' }) {
  return (
    <div className={cx('overflow-hidden flex items-center justify-center', className)}>
      <img src={isDarkMode ? logoDark : logo} alt="ForTechZ" className="w-full scale-[1.1] select-none" draggable={false} />
    </div>
  );
}

export const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors dark:[color-scheme:dark]';

export const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5';

export function Page({ children, className = '' }) {
  return <div className={cx('h-full overflow-y-auto p-6 flex flex-col gap-6 print:hidden [&>*]:shrink-0', className)}>{children}</div>;
}

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={cx('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, children, className = '' }) {
  return (
    <div className={cx('flex items-center justify-between gap-4 px-5 pt-5 pb-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// Tiny bar sparkline used on the KPI cards (as in the Figma dashboard).
export function MiniBars({ values, tone = 'green' }) {
  const vals = values && values.length ? values : [3, 5, 4, 6, 5, 8, 7];
  const max = Math.max(...vals, 1);
  const color = tone === 'red' ? 'bg-red-500' : tone === 'blue' ? 'bg-blue-500' : tone === 'amber' ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="flex items-end gap-[3px] h-8">
      {vals.map((v, i) => (
        <span key={i} className={cx('w-[5px] rounded-sm', color)} style={{ height: `${Math.max(12, (v / max) * 100)}%`, opacity: 0.45 + (i / vals.length) * 0.55 }} />
      ))}
    </div>
  );
}

const TONES = {
  blue: 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  red: 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  purple: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  slate: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
};

export function StatCard({ label, sub, value, icon: Icon, tone = 'blue', bars, barTone }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
          {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <span className={cx('w-9 h-9 rounded-full flex items-center justify-center', TONES[tone])}>
            <Icon size={17} />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between mt-4 gap-3">
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{value}</p>
        {bars !== false && <MiniBars values={bars} tone={barTone} />}
      </div>
    </Card>
  );
}

export function Badge({ tone = 'slate', children, className = '' }) {
  return <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap', TONES[tone], className)}>{children}</span>;
}

const BTN = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700',
  outline: 'border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-600/10',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const sz = size === 'lg' ? 'px-5 py-3 text-sm' : size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return (
    <button className={cx('inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed', sz, BTN[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({ tone = 'slate', className = '', children, ...rest }) {
  const t = {
    slate: 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
    blue: 'text-blue-600 dark:text-blue-400 hover:bg-blue-600/10',
    red: 'text-red-500 dark:text-red-400 hover:bg-red-500/10',
    green: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10',
    purple: 'text-violet-600 dark:text-violet-400 hover:bg-violet-500/10',
  }[tone];
  return <button className={cx('w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed', t, className)} {...rest}>{children}</button>;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = 'w-72', inputRef, ...rest }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input ref={inputRef} type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cx(inputCls, 'pl-9')} {...rest} />
    </div>
  );
}

// Pill tabs (Figma "Monthly / Weekly" + filter chips style).
export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={cx('inline-flex flex-wrap gap-1.5', className)}>
      {tabs.map(t => {
        const key = typeof t === 'string' ? t : t.key;
        const label = typeof t === 'string' ? t : t.label;
        const count = typeof t === 'string' ? undefined : t.count;
        const on = active === key;
        return (
          <button key={key} onClick={() => onChange(key)}
            className={cx('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
              on ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white')}>
            {label}{count !== undefined && <span className={cx('ml-1.5', on ? 'text-blue-100' : 'text-slate-400')}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ title, subtitle, icon: Icon, tone = 'blue', onClose, children, footer, width = 'max-w-md' }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className={cx('w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]', width)}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {Icon && <span className={cx('w-9 h-9 rounded-full flex items-center justify-center shrink-0', TONES[tone])}><Icon size={17} /></span>}
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {onClose && <IconButton onClick={onClose} title="Close"><X size={18} /></IconButton>}
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 pb-5 pt-1 flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', tone = 'red', icon, onConfirm, onCancel }) {
  return (
    <Modal title={title} icon={icon} tone={tone} onClose={onCancel}
      footer={<>
        <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button variant={tone === 'red' ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
      </>}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  const isError = /error|not found|cannot|failed|empty|required|only|out of stock|select|please/i.test(message);
  return (
    <div className="fixed top-5 right-5 z-[200] print:hidden">
      <div className={cx('flex items-center gap-3 pl-4 pr-5 py-3 rounded-xl shadow-2xl border text-sm font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-white',
        isError ? 'border-red-500/40' : 'border-emerald-500/40')}>
        <span className={cx('w-2 h-2 rounded-full', isError ? 'bg-red-500' : 'bg-emerald-500')} />
        {message}
      </div>
    </div>
  );
}

export function Avatar({ name = '?', size = 'w-9 h-9' }) {
  const palette = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-500', 'bg-rose-600', 'bg-cyan-600'];
  const idx = [...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <span className={cx('rounded-full text-white flex items-center justify-center font-semibold text-sm uppercase shrink-0', size, palette[idx])}>
      {String(name).charAt(0)}
    </span>
  );
}

// Table primitives
export const thCls = 'px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap';
export const tdCls = 'px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300';
export const trCls = 'border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

export function EmptyRow({ colSpan, children = 'Nothing to show yet.' }) {
  return <tr><td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">{children}</td></tr>;
}

export function Toolbar({ children, className = '' }) {
  return <div className={cx('flex flex-wrap items-center justify-between gap-3', className)}>{children}</div>;
}

// Right-side slide-over panel (Figma "Add Staff" / "Add Reservation" drawers).
export function Drawer({ title, subtitle, onClose, children, footer, width = 'max-w-md' }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-[2px] print:hidden" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={cx('w-full h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col', width)}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {onClose && <IconButton onClick={onClose} title="Close"><X size={18} /></IconButton>}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}
