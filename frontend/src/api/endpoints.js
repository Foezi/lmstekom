import { api } from './client.js';

const unwrap = (res) => res.data.data;

// ---------------- AUTH ----------------
export const loginRequest = async ({ username, password }) => unwrap(await api.post('/auth/login', { username, password }));
export const fetchMe = async () => unwrap(await api.get('/auth/me'));
export const lengkapiProfil = async (payload) => unwrap(await api.post('/auth/lengkapi-profil', payload));
export const verifyOtp = async ({ jenis, kode }) => unwrap(await api.post('/auth/verify-otp', { jenis, kode }));
export const resendOtp = async (jenis) => unwrap(await api.post('/auth/resend-otp', { jenis }));
export const connectDrive = async () => unwrap(await api.post('/auth/drive/connect'));
export const changePassword = async (payload) => unwrap(await api.put('/auth/password', payload));

// ---------------- MASTER DATA ----------------
const listParams = ({ page, limit, q, filters }) => ({
  page,
  limit,
  q: q || undefined,
  ...Object.fromEntries(Object.entries(filters || {}).filter(([, v]) => v !== '' && v != null)),
});

export function masterApi(entity) {
  return {
    list: async (params) => {
      const res = await api.get(`/${entity}`, { params: listParams(params) });
      return { rows: res.data.data, meta: res.data.meta };
    },
    create: async (body) => unwrap(await api.post(`/${entity}`, body)),
    update: async (id, body) => unwrap(await api.put(`/${entity}/${id}`, body)),
    remove: async (id) => unwrap(await api.delete(`/${entity}/${id}`)),

    downloadTemplate: () =>
      api.get(`/${entity}/import/template`, { responseType: 'blob' }),
    importPreview: async (file) =>
      unwrap(
        (
          await api.post(`/${entity}/import/preview`, fileToForm(file), {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        )
      ),
    importCommit: async (batchId) => unwrap(await api.post(`/${entity}/import/commit`, { batchId })),

    exportExcel: (params) => api.get(`/${entity}/export`, { params: listParams(params), responseType: 'blob' }),
  };
}

function fileToForm(file) {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

// ---------------- PROFIL SENDIRI ----------------
export const getDosenMe = async () => unwrap(await api.get('/dosen/me'));
export const updateDosenMe = async (body) => unwrap(await api.put('/dosen/me', body));
export const getMahasiswaMe = async () => unwrap(await api.get('/mahasiswa/me'));
export const updateMahasiswaMe = async (body) => unwrap(await api.put('/mahasiswa/me', body));

// ---------------- LOGS ----------------
export const activityLogApi = {
  list: async (params) => {
    const res = await api.get('/logs/activity', { params });
    return { rows: res.data.data, meta: res.data.meta };
  },
};
export const importLogApi = {
  list: async (params) => {
    const res = await api.get('/logs/import', { params });
    return { rows: res.data.data, meta: res.data.meta };
  },
};

/** Unduh blob sebagai file. */
export function saveBlob(res, filename) {
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
