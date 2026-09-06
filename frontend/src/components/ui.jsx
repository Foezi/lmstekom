export function Button({ variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}
      <input
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function Select({ label, options = [], placeholder = '— pilih —', className = '', ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}
      <select
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Alert({ type = 'info', children, onClose }) {
  const styles = {
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  };
  return (
    <div className={`flex items-start justify-between rounded-lg border px-4 py-3 text-sm ${styles[type]}`} role="alert">
      <div>{children}</div>
      {onClose && (
        <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100" aria-label="tutup">
          ×
        </button>
      )}
    </div>
  );
}

const BADGE_COLORS = {
  AKTIF: 'bg-emerald-100 text-emerald-700',
  NONAKTIF: 'bg-red-100 text-red-600',
  TERVERIFIKASI: 'bg-emerald-100 text-emerald-700',
  BELUM: 'bg-amber-100 text-amber-700',
  SUKSES: 'bg-emerald-100 text-emerald-700',
  SEBAGIAN: 'bg-amber-100 text-amber-700',
  GAGAL: 'bg-red-100 text-red-600',
};

export function Badge({ value }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_COLORS[value] || 'bg-slate-100 text-slate-600'}`}>
      {value}
    </span>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Spinner({ label = 'Memuat...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label}
    </div>
  );
}
