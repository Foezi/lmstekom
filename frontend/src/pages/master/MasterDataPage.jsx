import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable.jsx';
import { ImportWizard } from '../../components/ImportWizard.jsx';
import { ConfirmDialog, Modal } from '../../components/Modal.jsx';
import { Alert, Button, Input, Select } from '../../components/ui.jsx';
import { apiError } from '../../api/client.js';
import toast from 'react-hot-toast';
import { masterApi, saveBlob } from '../../api/endpoints.js';
import { IMPORT_ROLES, WRITE_ROLES, MENU } from '../../constants/rbac.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { MASTER_UI as MASTER_UI_CONFIGS } from './configs.jsx';
import { useNavigate, NavLink, useSearchParams } from 'react-router-dom';

import { SidebarMenu } from '../../components/SidebarMenu.jsx';

/**
 * Halaman CRUD generik untuk satu entitas master data.
 * Fitur: list+search+pagination, tambah/ubah/hapus, import wizard, export Excel.
 */
export function MasterDataPage({ entity }) {
  const config = MASTER_UI_CONFIGS[entity];
  const api = useMemo(() => masterApi(entity), [entity]);
  const { user } = useAuth();

  const canWrite = WRITE_ROLES[entity]?.includes(user.role);
  const canImport = IMPORT_ROLES[entity]?.includes(user.role);

  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create
  const [deleting, setDeleting] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const navigate = useNavigate();

  // Determine current group dynamically
  let currentGroup = 'Data Master';
  let tempGroup = null;
  for (const m of MENU) {
    if (m.group) tempGroup = m.group;
    if (m.entity === entity) {
      currentGroup = tempGroup || 'Data Master';
      break;
    }
  }

  let inGroup = false;
  const allowedSidebarMenu = MENU.reduce((acc, curr) => {
    if (curr.group === currentGroup) {
      inGroup = true;
      return acc;
    }
    if (curr.group) {
      inGroup = false;
    }
    if (inGroup && curr.to) {
      if (curr.roles === 'ALL' || (Array.isArray(curr.roles) && curr.roles.includes(user?.role))) {
        acc.push(curr);
      }
    }
    return acc;
  }, []);

  const [searchParams] = useSearchParams();
  const initialFilters = {};
  searchParams.forEach((val, key) => {
    initialFilters[key] = val;
  });

  const [filters, setFilters] = useState(initialFilters);
  const [prodis, setProdis] = useState([]);
  const [tahunAkademiks, setTahunAkademiks] = useState([]);
  const [resettingPassword, setResettingPassword] = useState(null);

  useEffect(() => {
    setFilters(initialFilters);
    if (['mata-kuliah', 'mahasiswa', 'kelas', 'jadwal'].includes(entity)) {
      masterApi('prodi').list({ limit: 1000 }).then(res => setProdis(res.rows || [])).catch(err => console.error("Gagal load prodi:", err));
    }
    if (['jadwal', 'kalender-akademik'].includes(entity)) {
      masterApi('tahun-akademik').list({ limit: 1000 }).then(res => setTahunAkademiks(res.rows || [])).catch(err => console.error("Gagal load TA:", err));
    }
  }, [entity]);

  const fetchFn = ({ page, limit, q, filters: f }) => api.list({ page, limit, q, filters: f });

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <SidebarMenu currentGroup={currentGroup} />

      {/* KANAN: Tabel Data Utama */}
      <div className="flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{config.title}</h1>
        </div>

      <DataTable
        key={entity}
        columns={[
          ...config.columns,
          ...(canWrite
            ? [
                {
                  key: '__aksi',
                  label: 'Aksi',
                  render: (r) => (
                    <span className="flex items-center gap-1">
                      {entity === 'mahasiswa' && (
                        <button title="Lihat Detil Mahasiswa" className="text-sky-600 hover:bg-sky-50 p-1.5 rounded-lg transition-colors" onClick={() => navigate(`/mahasiswa/${r.id}/detail`)}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      {entity === 'kelas' && (
                        <button title="Lihat Daftar Mahasiswa" className="text-sky-600 hover:bg-sky-50 p-1.5 rounded-lg transition-colors" onClick={() => navigate(`/kelas/${r.id}/mahasiswa`)}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </button>
                      )}
                      {entity === 'kelas' && r.tahunKurikulumId && (
                        <button title="Lihat Skema Kurikulum" className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" onClick={() => navigate(`/kelas/${r.id}/skema`)}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </button>
                      )}
                      <button title="Ubah Data" className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" onClick={() => { setEditing(r); setFormOpen(true); }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {entity === 'tahun-akademik' && (
                        <button title="Kelola Kalender Akademik" className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" onClick={() => navigate(`/kalender-akademik?tahunAkademikId=${r.id}`)}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      {['mahasiswa', 'dosen'].includes(entity) && (
                        <button title="Reset Password" className="text-orange-500 hover:bg-orange-50 p-1.5 rounded-lg transition-colors" onClick={() => setResettingPassword(r)}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                      )}
                      <button title="Hapus Data" className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" onClick={() => setDeleting(r)}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
        fetchFn={fetchFn}
        refreshKey={refreshKey}
        filters={filters}
        leftToolbar={
          <div className="flex flex-col sm:flex-row gap-2 max-w-full">
            {['mata-kuliah', 'mahasiswa', 'kelas'].includes(entity) && (
              <Select
                value={filters.prodiId || ''}
                onChange={(e) => setFilters(f => ({ ...f, prodiId: e.target.value }))}
                options={[{value:'', label:'Semua Prodi'}, ...prodis.map(p => ({ value: p.id, label: p.namaProdi }))]}
                className="w-full sm:w-48 !py-2"
              />
            )}
            {entity === 'mahasiswa' && (
              <Select
                value={filters.status || ''}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full sm:w-40 !py-2"
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: 'AKTIF', label: 'Aktif' },
                  { value: 'NONAKTIF', label: 'Nonaktif' },
                  { value: 'LULUS', label: 'Lulus' },
                  { value: 'DO', label: 'DO' },
                  { value: 'MENGUNDURKAN_DIRI', label: 'Mengundurkan Diri' },
                  { value: 'CUTI', label: 'Cuti' },
                ]}
              />
            )}
            {['jadwal', 'kalender-akademik'].includes(entity) && (
              <Select
                value={filters.tahunAkademikId || ''}
                onChange={(e) => setFilters(f => ({ ...f, tahunAkademikId: e.target.value }))}
                options={[{value:'', label:'Semua Tahun Akademik'}, ...tahunAkademiks.map(t => ({ value: t.id, label: t.nama }))]}
                className="w-full sm:w-64 !py-2"
              />
            )}
          </div>
        }
        toolbar={
          <>
            {canWrite && (
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>+ Tambah</Button>
            )}
            {canImport && <Button variant="secondary" onClick={() => setImportOpen(true)}>⬆ Import</Button>}
            <Button variant="secondary" onClick={() => api.exportExcel({ page: 1, limit: 10000, filters }).then((res) => saveBlob(res, `export-${entity}-${Date.now()}.xlsx`))}>
              ⬇ Export
            </Button>
          </>
        }
      />

      <FormModal
        open={formOpen}
        entity={entity}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(msg) => {
          setFormOpen(false);
          toast.success(msg);
          setRefreshKey((k) => k + 1);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        message={`Hapus ${config.title.toLowerCase()} "${deleting ? (deleting.namaProdi || deleting.namaKelas || deleting.nama || deleting.nim || deleting.kodeRuangan || deleting.kodeMk || '') : ''}"? Tindakan ini tidak dapat dibatalkan.`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          try {
            await api.remove(deleting.id);
            setDeleting(null);
            toast.success('Data dihapus');
            setRefreshKey((k) => k + 1);
          } catch (err) {
            setDeleting(null);
            toast.error(apiError(err));
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(resettingPassword)}
        message={`Reset password ke default untuk ${config.title.toLowerCase()} "${resettingPassword ? (resettingPassword.nama || resettingPassword.nim || resettingPassword.nidn) : ''}"? Password akan dikembalikan ke format bawaan (NIM/NIDN + @poltek).`}
        onCancel={() => setResettingPassword(null)}
        onConfirm={async () => {
          try {
            await api.resetPassword(resettingPassword.id);
            setResettingPassword(null);
            toast.success('Password berhasil di-reset!');
          } catch (err) {
            setResettingPassword(null);
            toast.error(apiError(err));
          }
        }}
      />

      <ImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        master={{ entity, title: config.title, downloadTemplate: api.downloadTemplate, importPreview: api.importPreview, importCommit: api.importCommit }}
        onImported={() => {
          toast.success('Import selesai');
          setRefreshKey((k) => k + 1);
        }}
      />
      </div>
    </div>
  );
}

// ---------------- FORM MODAL ----------------

function FormModal({ open, entity, editing, onClose, onSaved }) {
  const config = MASTER_UI_CONFIGS[entity];
  const [values, setValues] = useState({});
  const [refs, setRefs] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setValues(objectToForm(config.fields, editing));
    } else {
      setValues(defaultsFrom(config.fields));
    }
    // muat opsi referensi sekali per buka modal
    const refEntities = [...new Set(config.fields.filter((f) => f.type === 'ref').map((f) => f.refEntity))];
    Promise.all(refEntities.map((re) => masterApi(re).list({ page: 1, limit: 200 }).then((r) => [re, r.rows])))
      .then((pairs) => setRefs(Object.fromEntries(pairs)))
      .catch((e) => setError(apiError(e, 'Gagal memuat data referensi')));
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = formToObject(config.fields, values);
      if (editing) await masterApi(entity).update(editing.id, payload);
      else await masterApi(entity).create(payload);
      onSaved(editing ? 'Perubahan tersimpan' : 'Data baru ditambahkan');
    } catch (err) {
      setError(apiError(err, 'Gagal menyimpan'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={`${editing ? 'Ubah' : 'Tambah'} ${config.title}`} onClose={onClose}>
      {error && (
        <div className="mb-4">
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        {config.fields.map((field) => {
          const value = values[field.name] ?? '';
          const setValue = (v) => setValues((prev) => ({ ...prev, [field.name]: v }));
          const disabledByDeps =
            field.dependsOn && !values[field.dependsOn];
          const isDisabled = disabledByDeps || (typeof field.disabled === 'function' ? field.disabled(values) : field.disabled);
          const isRequired = typeof field.required === 'function' ? field.required(values) : field.required;
          const isHidden = typeof field.hidden === 'function' ? field.hidden(values) : field.hidden;

          if (isHidden) return null;

          if (field.type === 'ref') {
            let options = refs[field.refEntity] || [];
            if (field.filterOpts) {
              options = options.filter(o => field.filterOpts(o, values));
            } else if (field.dependsOn) {
              options = options.filter((o) => String(o.prodiId) === String(values[field.dependsOn]));
            }
            return (
              <Select
                key={field.name}
                label={`${field.label}${disabledByDeps ? ' (pilih opsi sebelumnya)' : ''}`}
                required={isRequired}
                disabled={isDisabled}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={disabledByDeps ? '— tergantung opsi sebelumnya —' : '— pilih —'}
                options={options.map((o) => ({
                  value: o.id,
                  label:
                    o.namaKelas
                      ? `${o.namaKelas} (${o.prodiKode || ''})`
                      : o.namaProdi
                        ? `${o.kodeProdi} — ${o.namaProdi}`
                        : o.nidn
                          ? `${o.nidn} — ${o.nama}`
                          : o.tahun
                            ? `Tahun ${o.tahun}`
                            : o.kodeMk
                              ? `${o.kodeMk} — ${o.namaMk}`
                              : o.kodeSesi
                                ? `${o.kodeSesi} (${o.jamMulai} - ${o.jamSelesai})`
                                : o.namaRuangan
                                  ? `${o.kodeRuangan} — ${o.namaRuangan}`
                                  : o.kode
                                    ? `${o.kode} — ${o.nama}`
                                    : `${o.id}`,
                }))}
              />
            );
          }
          if (field.type === 'select') {
            return (
              <Select
                key={field.name}
                label={field.label}
                required={isRequired}
                disabled={isDisabled}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                options={field.options}
              />
            );
          }
          return (
            <Input
              key={field.name}
              label={field.label}
              type={['number', 'time', 'email', 'password', 'date'].includes(field.type) ? field.type : 'text'}
              required={isRequired}
              disabled={isDisabled}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          );
        })}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function defaultsFrom(fields) {
  const out = {};
  for (const f of fields) out[f.name] = f.default ?? '';
  return out;
}

function objectToForm(fields, obj) {
  const out = {};
  for (const f of fields) {
    let v = obj[f.name];
    if (v === null || v === undefined) {
      out[f.name] = '';
    } else if (f.type === 'date') {
      out[f.name] = new Date(v).toISOString().split('T')[0];
    } else {
      out[f.name] = String(v);
    }
  }
  return out;
}

function formToObject(fields, values) {
  const out = {};
  for (const f of fields) {
    let v = values[f.name];
    if (v === '') v = null;
    out[f.name] = v;
  }
  // properti null tidak dikirim agar tidak menimpa nilai existing pada update parsial
  Object.keys(out).forEach((k) => out[k] === null && delete out[k]);
  return out;
}
