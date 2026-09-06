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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
          {leftToolbar}
          <div className="w-full sm:w-64">
            <Input placeholder="Cari..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
