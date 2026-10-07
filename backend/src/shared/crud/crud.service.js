import { db } from '../../core/database.js';
import { ApiError } from '../utils/apiError.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import { parseWorkbook, buildTemplate, buildExport } from '../utils/excel.js';
import { saveBatch, getBatch, deleteBatch } from '../utils/importBatchStore.js';

/**
 * Factory service CRUD + import/export untuk entitas master data (blueprint §6.1).
 * Semua query otomatis dibatasi oleh scope role (multi-tenant scoping §4.3-1).
 */
export function createCrudService(config) {
  const model = () => db[config.model];

  /** Where tambahan sesuai role (mis. Admin Prodi hanya prodinya). */
  const scopeOf = (user) => {
    if (!config.scopeWhere) return undefined;
    return config.scopeWhere(user);
  };

  const scopedFindFirst = async (user, where) => {
    const scope = scopeOf(user);
    const clause = scope ? { AND: [where, scope] } : where;
    return model().findFirst({ where: clause, include: config.include });
  };

  const assertScopedExists = async (user, id) => {
    const record = await scopedFindFirst(user, { id });
    if (!record) throw ApiError.notFound(`${config.label} tidak ditemukan`);
    return record;
  };

  // ---------------- LIST / DETAIL ----------------

  async function list({ user, query }) {
    const { skip, take, page, limit, q } = parsePagination(query);
    const clauses = [];
    const scope = scopeOf(user);
    if (scope) clauses.push(scope);

    if (q) {
      const orClauses = [];
      if (config.searchFields?.length) {
        orClauses.push(
          ...config.searchFields.map((field) => {
            const parts = field.split('.');
            if (parts.length === 2) return { [parts[0]]: { [parts[1]]: { contains: q } } };
            return { [field]: { contains: q } };
          })
        );
      }
      if (config.numericSearchFields?.length) {
        const num = parseInt(q, 10);
        if (!isNaN(num)) {
          orClauses.push(
            ...config.numericSearchFields.map((field) => ({
              [field]: num,
            }))
          );
        }
      }
      if (orClauses.length) {
        clauses.push({ OR: orClauses });
      }
    }
    for (const filter of config.filters || []) {
      const value = filter.parse ? filter.parse(query[filter.name]) : query[filter.name];
      if (value !== undefined && value !== null && value !== '') {
        clauses.push({ [filter.field]: value });
      }
    }

    const where = clauses.length ? { AND: clauses } : {};
    const [rows, total] = await Promise.all([
      model().findMany({
        where,
        skip,
        take,
        orderBy: config.orderBy,
        include: config.include,
      }),
      model().count({ where }),
    ]);
    return { rows: rows.map(config.toDto), meta: buildMeta({ page, limit }, total) };
  }

  async function listAllForExport({ user, query }) {
    const clauses = [];
    const scope = scopeOf(user);
    if (scope) clauses.push(scope);
    for (const filter of config.filters || []) {
      const value = filter.parse ? filter.parse(query[filter.name]) : query[filter.name];
      if (value !== undefined && value !== null && value !== '') {
        clauses.push({ [filter.field]: value });
      }
    }
    const rows = await model().findMany({
      where: clauses.length ? { AND: clauses } : {},
      orderBy: config.orderBy,
      include: config.include,
    });
    return rows.map(config.toDto);
  }

  const getById = ({ user, id }) => assertScopedExists(user, id);

  // ---------------- WRITE ----------------

  async function create({ user, data }) {
    if (config.assertWriteScope) await config.assertWriteScope(user, data);
    if (config.beforeWrite) await config.beforeWrite(data, null, user);
    
    const recordData = config.mapToPrisma ? config.mapToPrisma(data) : data;
    
    const record = await model().create({ data: recordData, include: config.include });
    await config.afterWrite?.(record, null, user, db, data);
    return config.toDto(record);
  }

  async function update({ user, id, data }) {
    const existing = await assertScopedExists(user, id);
    if (config.assertWriteScope) await config.assertWriteScope(user, data, existing);
    if (config.beforeWrite) await config.beforeWrite(data, existing, user);
    
    const recordData = config.mapToPrisma ? config.mapToPrisma(data) : data;
    
    const record = await model().update({ where: { id }, data: recordData, include: config.include });
    await config.afterWrite?.(record, existing, user, db, data);
    return config.toDto(record);
  }

  async function remove({ user, id }) {
    const existing = await assertScopedExists(user, id);
    await config.beforeDelete?.(existing, user, db);
    await model().delete({ where: { id } });
    return { pesan: `${config.label} "${config.rowLabel(existing)}" telah dihapus` };
  }

  // ---------------- IMPORT / EXPORT ----------------

  const templateBuffer = () =>
    buildTemplate(
      config.importColumns.map((c) => c.header),
      config.importExample,
      config.label
    );

  /**
   * Preview import: validasi tanpa commit (blueprint §6.1 — idempotent import).
   * Return batch_id + rincian baris valid vs error.
   */
  async function importPreview({ user, file }) {
    if (!file) throw ApiError.badRequest('File import tidak disertakan');

    let rawRows;
    try {
      rawRows = parseWorkbook(file.buffer);
    } catch {
      throw ApiError.badRequest('File tidak dapat dibaca. Gunakan template .xlsx/.xls/.csv');
    }
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      throw ApiError.badRequest('File kosong atau tidak berisi data');
    }

    const headers = Object.keys(rawRows[0]);
    const missing = config.importColumns.filter((c) => !headers.includes(c.header));
    if (missing.length) {
      throw ApiError.badRequest(`Kolom wajib tidak ditemukan: ${missing.map((c) => c.header).join(', ')}`);
    }

    const caches = await config.loadRefCaches(db);
    const existingKeys = await config.loadExistingKeys(db);
    const seenKeys = new Map();

    const validRows = [];
    const validOriginals = [];
    const errors = [];

    rawRows.forEach((raw, idx) => {
      const excelRow = idx + 2; // +1 header, +1 basis satu
      const data = {};
      let rowValid = true;

      const fail = (kolom, pesan) => {
        rowValid = false;
        errors.push({ baris: excelRow, kolom, pesan });
      };

      for (const col of config.importColumns) {
        let cell = raw[col.header];
        cell = cell === null || cell === undefined ? '' : cell;

        if (col.type === 'int') {
          const num = Number(String(cell).trim());
          if (cell === '' || !Number.isInteger(num)) {
            fail(col.header, `${col.header} harus berupa angka bulat`);
            continue;
          }
          data[col.field] = num;
          continue;
        }

        const str = String(cell).trim();
        if (!str && col.required) {
          fail(col.header, `${col.header} wajib diisi`);
          continue;
        }
        if (str && col.enum) {
          const upper = str.toUpperCase();
          if (!col.enum.includes(upper)) {
            fail(col.header, `${col.header} harus salah satu dari: ${col.enum.join('/')}`);
            continue;
          }
          data[col.field] = upper;
          continue;
        }
        if (str && col.ref) {
          const resolved = col.ref.resolve(str, caches, data);
          if (resolved === undefined || resolved === null) {
            fail(col.header, `${str} tidak terdaftar pada sistem`);
            continue;
          }
          data[col.field] = resolved;
          continue;
        }
        data[col.field] = str === '' ? col.default ?? null : str;
      }

      if (!rowValid) return;

      // duplikat di dalam file & terhadap database
      for (const keyStr of config.uniqueKeys(data)) {
        if (seenKeys.has(keyStr)) {
          fail('(duplikat)', `Baris duplikat dengan baris ${seenKeys.get(keyStr)} (${keyStr})`);
          return;
        }
        if (existingKeys.has(keyStr)) {
          fail('(duplikat)', `${keyStr} sudah ada di database`);
          return;
        }
        seenKeys.set(keyStr, excelRow);
      }

      config.validateRow?.(data, fail);
      if (rowValid) {
        validRows.push(data);
        validOriginals.push(raw);
      }
    });

    const batchId = saveBatch({ userId: user.id, entity: config.model, rows: validRows, errors });

    return {
      batchId,
      totalBaris: rawRows.length,
      jumlahValid: validRows.length,
      jumlahError: errors.length,
      errors,
      preview: validOriginals,
    };
  }

  /** Commit import: eksekusi baris valid dalam satu transaksi + catat ImportLog. */
  async function importCommit({ user, batchId, ipAddress }) {
    const batch = getBatch(batchId, { userId: user.id, entity: config.model });
    if (!batch) throw ApiError.notFound('Batch import tidak ditemukan atau kedaluwarsa, ulangi preview');
    if (!batch.rows.length) {
      throw ApiError.badRequest('Tidak ada baris valid untuk dikomit');
    }

    let inserted = 0;
    try {
      await db.$transaction(async (tx) => {
        for (const item of batch.rows) {
          config.beforeWrite?.(item, null, user);
          const recordData = config.mapToPrisma ? config.mapToPrisma(item) : item;
          const record = await tx[config.model].create({ data: recordData });
          await config.afterWrite?.(record, null, user, tx, item);
          inserted += 1;
        }
      });
    } catch (err) {
      await logImport(user, inserted, 'GAGAL', { fatal: err.message }, ipAddress);
      throw err instanceof ApiError ? err : ApiError.conflict('Import gagal di tengah proses, seluruh perubahan dibatalkan', { penyebab: err.message });
    }

    const status = batch.errors.length ? 'SEBAGIAN' : 'SUKSES';
    await logImport(user, inserted, status, batch.errors.length ? { errors: batch.errors } : undefined, ipAddress);
    deleteBatch(batchId);

    return {
      pesan: `${inserted} baris ${config.label.toLowerCase()} berhasil diimport`,
      jumlahDiinsert: inserted,
      jumlahDilewati: batch.errors.length,
      status,
    };
  }

  async function logImport(user, jumlahBaris, status, catatanError, ipAddress) {
    try {
      await db.importLog.create({
        data: {
          userId: user.id,
          jenisData: config.model,
          jumlahBaris,
          status,
          ...(catatanError ? { catatanError } : {}),
        },
      });
      const { logActivity } = await import('../utils/activityLog.js');
      await logActivity({
        userId: user.id,
        aktivitas: `IMPORT_${status}`,
        modul: config.model.toUpperCase(),
        ipAddress,
      });
    } catch (err) {
      console.error('[import_log] gagal mencatat:', err.message);
    }
  }

  const exportBuffer = async ({ user, query }) => {
    const rows = await listAllForExport({ user, query });
    return buildExport(rows, config.exportColumns, config.label);
  };

  return { list, getById, create, update, remove, templateBuffer, importPreview, importCommit, exportBuffer };
}
