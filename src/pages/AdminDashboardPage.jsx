import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/admin/dashboard/summary')
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, []);

  if (!summary && !error) return <p>Loading...</p>;
  if (!summary) return <p style={{ color: 'red' }}>{error}</p>;

  const rows = [
    ['Total Users', summary.totalUsers],
    ['Active Auctions', summary.activeAuctions],
    ['Active Categories', summary.activeCategories],
    ['Total Categories', summary.totalCategories],
    ['Pending Reports', summary.pendingReports],
    ['Resolved Reports', summary.resolvedReports],
    ['Dismissed Reports', summary.dismissedReports],
    ['Total Moderation Actions', summary.totalModerationActions],
  ];

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <table style={{ borderCollapse: 'collapse', minWidth: 320 }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 16px 8px 0', color: '#555' }}>{label}</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: 18 }}>{value ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
