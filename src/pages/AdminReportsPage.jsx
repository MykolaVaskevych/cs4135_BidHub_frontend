import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/admin/reports${params}`)
      .then((data) => { if (!cancelled) setReports(data ?? []); })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [reloadKey, statusFilter]);

  const action = useCallback(async (reportId, act) => {
    setMsg(''); setError('');
    try {
      await api.post(`/admin/reports/${reportId}/${act}`);
      setMsg(`Report ${act}d`);
      reload();
    } catch (err) { setError(err.body?.message || err.message); }
  }, []);

  const statusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'text-amber-700';
      case 'RESOLVED': return 'text-green-700';
      case 'DISMISSED': return 'text-gray-500';
      default: return 'text-gray-700';
    }
  };

  const btnBase = 'px-2.5 py-1 text-xs font-medium border';
  const btnPrimary = `${btnBase} text-white bg-gray-900 border-gray-900 hover:bg-gray-800`;
  const btnSecondary = `${btnBase} text-gray-900 bg-white border-gray-300 hover:bg-gray-50`;
  const inputCls = 'px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500';

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Reports</h3>
      <p className="text-sm text-gray-600 mb-4">
        User-submitted complaints about other users or listings. Any logged-in user can submit a report
        from an auction page. <strong>Resolve</strong> to acknowledge, <strong>Dismiss</strong> to reject.
        Only PENDING reports show action buttons.
      </p>
      {msg && <p className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">No reports found.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">ID</th>
                <th className="px-3 py-2 font-medium text-gray-700">Reported User</th>
                <th className="px-3 py-2 font-medium text-gray-700">Reason</th>
                <th className="px-3 py-2 font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 font-medium text-gray-700">Created</th>
                <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.reportId} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-mono text-xs">{r.reportId?.slice(0, 8)}…</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.reportedUserId?.slice(0, 8)}…</td>
                  <td className="px-3 py-2">{r.reason}</td>
                  <td className={`px-3 py-2 font-medium ${statusClass(r.status)}`}>{r.status}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {r.status === 'PENDING' ? (
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => action(r.reportId, 'resolve')} className={btnPrimary}>Resolve</button>
                        <button onClick={() => action(r.reportId, 'dismiss')} className={btnSecondary}>Dismiss</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
