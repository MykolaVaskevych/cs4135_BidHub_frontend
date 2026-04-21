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

  if (!summary && !error) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!summary) return <p className="text-sm text-red-600">{error}</p>;

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
      <h3 className="text-lg font-semibold mb-3">Summary</h3>
      <table className="min-w-xs border-collapse">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-gray-100">
              <td className="pr-8 py-2 text-sm text-gray-500">{label}</td>
              <td className="py-2 text-lg font-bold text-gray-900">{value ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
