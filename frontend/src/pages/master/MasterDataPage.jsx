import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable.jsx';
import { ImportWizard } from '../../components/ImportWizard.jsx';
import { ConfirmDialog, Modal } from '../../components/Modal.jsx';
import { Alert, Button, Input, Select } from '../../components/ui.jsx';
import { apiError } from '../../api/client.js';
import { masterApi, saveBlob } from '../../api/endpoints.js';
import { IMPORT_ROLES, WRITE_ROLES } from '../../constants/rbac.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { MASTER_UI as MASTER_UI_CONFIGS } from './configs.jsx';

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
  const [notice, setNotice] = useState(null);

  const fetchFn = ({ page, limit, q }) => api.list({ page, limit, q });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Data Master · {config.title}</h1>
        {notice && (
          <Alert type="success" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}
      </div>

      <DataTable
        columns={[
          ...config.columns,
          ...(canWrite
            ? [
                {
                  key: '__aksi',
                  label: 'Aksi',
                  render: (r) => (
                    <span className="flex items-center gap-2">
                      <button className="text-blue-600 hover:underline" onClick={() => { setEditing(r); setFormOpen(true); }}>
                        Ubah
                      </button>
                      <button className="text-red-500 hover:underline" onClick={() => setDeleting(r)}>
                        Hapus
                      </button>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
        fetchFn={fetchFn}
        refreshKey={refreshKey}
        toolbar={
          <>
            {canWrite && (
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>+ Tambah</Button>
            )}
            {canImport && <Button variant="secondary" onClick={() => setImportOpen(true)}>⬆ Import</Button>}
            <Button variant="secondary" onClick={() => api.exportExcel({ page: 1, limit: 10 }).then((res) => saveBlob(res, `export-${entity}-${Date.now()}.xlsx`))}>
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
          setNotice(msg);
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
            setNotice('Data dihapus');
            setRefreshKey((k) => k + 1);
          } catch (err) {
            setDeleting(null);
            setNotice(null);
            alert(apiError(err));
          }
        }}
      />

      <ImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        master={{ entity, title: config.title, downloadTemplate: api.downloadTemplate, importPreview: api.importPreview, importCommit: api.importCommit }}
        onImported={() => {
          setNotice('Import selesai');
          setRefreshKey((k) => k + 1);
        }}
      />
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

          if (field.type === 'ref') {
            let options = refs[field.refEntity] || [];
            if (field.dependsOn) {
              options = options.filter((o) => String(o.prodiId) === String(values[field.dependsOn]));
            }
            return (
              <Select
                key={field.name}
                label={`${field.label}${disabledByDeps ? ' (pilih prodi dulu)' : ''}`}
                required={field.required}
                disabled={disabledByDeps}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={disabledByDeps ? '— tergantung prodi —' : '— pilih —'}
                options={options.map((o) => ({
                  value: o.id,
                  label:
                    o.namaKelas
                      ? `${o.namaKelas} (${o.prodiKode || ''})`
                      : o.namaProdi
                        ? `${o.kodeProdi} — ${o.namaProdi}`
                        : `${o.nidn} — ${o.nama}`,
                }))}
              />
            );
          }
          if (field.type === 'select') {
            return (
              <Select
                key={field.name}
                label={field.label}
                required={field.required}
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
              type={field.type === 'number' ? 'number' : 'text'}
              required={field.required}
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
    const v = obj[f.name];
    out[f.name] = v === null || v === undefined ? '' : String(v);
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
