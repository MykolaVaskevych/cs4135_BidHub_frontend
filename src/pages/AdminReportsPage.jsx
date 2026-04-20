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

  return (
    <div>
      <h2>Admin: Reports</h2>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
        User-submitted complaints about other users or listings. Any logged-in user can submit a report
        (e.g. from an auction page). <strong>Resolve</strong> to acknowledge; <strong>Dismiss</strong> to reject.
        Only PENDING reports show action buttons.
      </p>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {reports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th>ID</th>
              <th>Reported User</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.reportId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.reportId?.slice(0, 8)}…</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.reportedUserId?.slice(0, 8)}…</td>
                <td>{r.reason}</td>
                <td>{r.status}</td>
                <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                <td style={{ display: 'flex', gap: 4 }}>
                  {r.status === 'PENDING' && (
                    <>
                      <button onClick={() => action(r.reportId, 'resolve')}>Resolve</button>
                      <button onClick={() => action(r.reportId, 'dismiss')}>Dismiss</button>
                    </>
                  )}
                  {r.status !== 'PENDING' && <span style={{ color: '#999' }}>{r.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
