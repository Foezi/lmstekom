import { api } from './client.js';

const unwrap = (res) => res.data.data;

// ---------------- AUTH ----------------
export const loginRequest = async ({ username, password }) => unwrap(await api.post('/auth/login', { username, password }));
export const fetchMe = async () => unwrap(await api.get('/auth/me'));
export const lengkapiProfil = async (payload) => unwrap(await api.post('/auth/lengkapi-profil', payload));
export const verifyOtp = async ({ jenis, kode }) => unwrap(await api.post('/auth/verify-otp', { jenis, kode }));
export const resendOtp = async (jenis) => unwrap(await api.post('/auth/resend-otp', { jenis }));
export const connectDrive = async () => unwrap(await api.post('/auth/drive/connect'));
export const updateProfile = async (formData) => unwrap(await api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
export const changePassword = async (payload) => unwrap(await api.put('/auth/password', payload));

// ---------------- MATERI & PERTEMUAN ----------------
export const getMateriList = () => api.get('/materi');
export const getPertemuanMateri = (jadwalId) => api.get(`/materi/${jadwalId}/pertemuan`);
export const generatePertemuanMateri = (jadwalId, payload) => api.post(`/materi/${jadwalId}/pertemuan/generate`, payload);
export const addMateri = (pertemuanId, formData) => api.post(`/materi/pertemuan/${pertemuanId}/materi`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteMateri = (materiId) => api.delete(`/materi/${materiId}`);
export const addTugasToPertemuan = async (pertemuanId, payload) => unwrap(await api.post(`/materi/pertemuan/${pertemuanId}/tugas`, payload));
export const addKuisToPertemuan = async (pertemuanId, payload) => unwrap(await api.post(`/materi/pertemuan/${pertemuanId}/kuis`, payload));
export const removeTugasFromPertemuan = async (id) => unwrap(await api.delete(`/materi/pertemuan/tugas/${id}`));
export const removeKuisFromPertemuan = async (id) => unwrap(await api.delete(`/materi/pertemuan/kuis/${id}`));
export const getTugasSubmissions = async (id) => unwrap(await api.get(`/materi/pertemuan/tugas/${id}/submissions`));
export const updateNilaiTugasSubmission = async (id, payload) => unwrap(await api.put(`/materi/pertemuan/tugas/submissions/${id}`, payload));
export const getKuisSubmissions = async (id) => unwrap(await api.get(`/materi/pertemuan/kuis/${id}/submissions`));
export const getMateriAkses = async (materiId) => unwrap(await api.get(`/materi/${materiId}/akses`));
export const recordMateriAkses = async (materiId) => unwrap(await api.post(`/materi/${materiId}/akses`, {}));

// ---------------- BANK TUGAS & KUIS ----------------
export const getBankTugasByMk = async (mkId) => unwrap(await api.get(`/bank-tugas-kuis/matakuliah/${mkId}/tugas`));
export const createBankTugas = async (payload) => unwrap(await api.post(`/bank-tugas-kuis/tugas`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }));
export const updateBankTugas = async (id, payload) => unwrap(await api.put(`/bank-tugas-kuis/tugas/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }));
export const deleteBankTugas = async (id) => unwrap(await api.delete(`/bank-tugas-kuis/tugas/${id}`));

export const getBankKuisByMk = async (mkId, tipeUjian) => unwrap(await api.get(`/bank-tugas-kuis/matakuliah/${mkId}/kuis${tipeUjian ? `?tipeUjian=${tipeUjian}` : ''}`));
export const getBankKuisById = async (id) => unwrap(await api.get(`/bank-tugas-kuis/kuis/${id}`));
export const createBankKuis = async (payload) => unwrap(await api.post(`/bank-tugas-kuis/kuis`, payload));
export const updateBankKuis = async (id, payload) => unwrap(await api.put(`/bank-tugas-kuis/kuis/${id}`, payload));
export const deleteBankKuis = async (id) => unwrap(await api.delete(`/bank-tugas-kuis/kuis/${id}`));

export const getBankKuisSoal = async (kuisId) => unwrap(await api.get(`/bank-tugas-kuis/kuis/${kuisId}/soal`));
export const createBankKuisSoal = async (kuisId, payload) => unwrap(await api.post(`/bank-tugas-kuis/kuis/${kuisId}/soal`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }));
export const updateBankKuisSoal = async (kuisId, soalId, payload) => unwrap(await api.put(`/bank-tugas-kuis/kuis/${kuisId}/soal/${soalId}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }));
export const deleteBankKuisSoal = async (kuisId, soalId) => unwrap(await api.delete(`/bank-tugas-kuis/kuis/${kuisId}/soal/${soalId}`));

// ---------------- VIDEO INTERAKTIF ----------------
export const getVideoQuestions = async (materiId) => unwrap(await api.get(`/materi/${materiId}/video-questions`));
export const addVideoQuestion = async (materiId, payload) => unwrap(await api.post(`/materi/${materiId}/video-questions`, payload));
export const updateVideoQuestion = async (materiId, qId, payload) => unwrap(await api.put(`/materi/${materiId}/video-questions/${qId}`, payload));
export const deleteVideoQuestion = async (materiId, qId) => unwrap(await api.delete(`/materi/${materiId}/video-questions/${qId}`));
export const getVideoProgress = async (materiId) => unwrap(await api.get(`/materi/${materiId}/video-progress`));
export const saveVideoProgress = async (materiId, payload) => unwrap(await api.post(`/materi/${materiId}/video-progress`, payload));

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
    get: async (id) => unwrap(await api.get(`/${entity}/${id}`)),
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
    resetPassword: async (id) => unwrap(await api.post(`/${entity}/${id}/reset-password`)),
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

// ---------------- PERKULIAHAN ----------------
export const getRekapNilaiAdmin = async (params) => unwrap(await api.get('/nilai/admin/rekap', { params }));

// ---------------- PRESENSI ----------------
export const getPresensiPertemuan = async (pertemuanId) => unwrap(await api.get(`/presensi/pertemuan/${pertemuanId}`));
export const syncPresensiAsinkronus = async (pertemuanId) => unwrap(await api.post(`/presensi/pertemuan/${pertemuanId}/sync`, {}));
export const savePresensiManual = async (pertemuanId, data) => unwrap(await api.put(`/presensi/pertemuan/${pertemuanId}/manual`, { data }));

// ---------------- DASHBOARD ----------------
export const getDashboardData = async () => unwrap(await api.get('/dashboard'));

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
