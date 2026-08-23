import { useState } from 'react';
import { DataTable } from '../components/DataTable.jsx';
import { Badge, Card } from '../components/ui.jsx';
import { activityLogApi, importLogApi } from '../api/endpoints.js';

/** Audit trail & log import — khusus Administrator (blueprint §8). */
export default function LogsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshAll = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Log Sistem</h1>

      <Card title="Activity Log (audit trail)">
        <DataTable
          columns={[
            { key: 'waktu', label: 'Waktu', render: (r) => new Date(r.waktu).toLocaleString('id-ID') },
            { key: 'user', label: 'User', render: (r) => r.user?.username ?? '-' },
            { key: 'aktivitas', label: 'Aktivitas' },
            { key: 'modul', label: 'Modul' },
            { key: 'ipAddress', label: 'IP', render: (r) => r.ipAddress || '-' },
          ]}
          fetchFn={(p) => activityLogApi.list(p)}
          limit={10}
          toolbar={
            <button onClick={refreshAll} className="text-sm text-blue-600 hover:underline">
              Muat ulang
            </button>
          }
        />
      </Card>

      <Card title="Import Log">
        <DataTable
          columns={[
            { key: 'waktu', label: 'Waktu', render: (r) => new Date(r.waktu).toLocaleString('id-ID') },
            { key: 'user', label: 'User', render: (r) => r.user?.username ?? '-' },
            { key: 'jenisData', label: 'Jenis Data' },
            { key: 'jumlahBaris', label: 'Baris' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          fetchFn={(p) => importLogApi.list(p)}
          limit={10}
          refreshKey={refreshKey}
        />
      </Card>
    </div>
  );
}
