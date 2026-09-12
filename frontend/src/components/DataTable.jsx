import { useEffect, useRef, useState } from 'react';
import { Button, Input, Spinner } from './ui.jsx';

/**
 * Tabel data server-side: search (debounce), pagination.
 * Props: columns [{key,label,render}], fetchFn({page,limit,q}) -> {rows, meta},
 *        toolbar (elemen tambahan di header), refreshKey (naikkan untuk reload).
 */
export function DataTable({ columns, fetchFn, toolbar, leftToolbar, filters = {}, refreshKey = 0, limit = 10 }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [q]);

  const filtersStr = JSON.stringify(filters);

  useEffect(() => {
    setPage(1);
  }, [filtersStr]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchRef
      .current({ page, limit, q: query, filters })
      .then((result) => {
        if (!alive) return;
        setRows(result.rows);
        setMeta(result.meta);
      })
      .catch(() => alive && setError('Gagal memuat data'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page, query, filtersStr, refreshKey, limit]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500 overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-4 md:p-6 border-b border-orange-100 flex flex-col md:flex-row gap-4 items-center bg-white">
        <div className="flex-1 w-full relative">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {leftToolbar}
          {toolbar}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <Spinner />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id ?? row.nim ?? row.nidn} className="border-b border-slate-50 hover:bg-slate-50/60">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-2.5 align-middle text-slate-700">
                      {c.render ? c.render(row) : (row[c.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-slate-500">
          <span>
            Halaman {meta.page} dari {meta.totalPages} · total {meta.total} data
          </span>
          <div className="flex gap-1">
            <Button variant="secondary" disabled={meta.page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹ Sebelumnya
            </Button>
            <Button
              variant="secondary"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya ›
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
