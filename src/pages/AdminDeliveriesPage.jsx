import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export default function AdminDeliveriesPage() {
  const [jobs, setJobs] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get('/delivery/disputed')
      .then((data) => { if (!cancelled) setJobs(data ?? []); })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleResolve = useCallback(async (jobId) => {
    setMsg(''); setError('');
    try {
      await api.post(`/delivery/${jobId}/resolve-dispute`);
      setMsg('Dispute resolved — job confirmed, escrow released.');
      setReloadKey((k) => k + 1);
    } catch (err) { setError(err.body?.message || err.message); }
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Disputed Deliveries</h3>
      <p className="text-sm text-gray-600 mb-4">
        These delivery jobs have an active dispute raised by the buyer. Resolving moves the job
        to Confirmed and releases escrow to the seller.
      </p>
      {msg && <p role="status" className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      {jobs.length === 0 ? (
        <p className="text-sm text-gray-500">No disputed deliveries.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Job ID</th>
                <th className="px-3 py-2 font-medium text-gray-700">Buyer ID</th>
                <th className="px-3 py-2 font-medium text-gray-700">Seller ID</th>
                <th className="px-3 py-2 font-medium text-gray-700">Created</th>
                <th className="px-3 py-2 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.deliveryJobId} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-mono text-xs">{j.deliveryJobId?.slice(0, 8)}…</td>
                  <td className="px-3 py-2 font-mono text-xs">{j.buyerId?.slice(0, 8)}…</td>
                  <td className="px-3 py-2 font-mono text-xs">{j.sellerId?.slice(0, 8)}…</td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleResolve(j.deliveryJobId)}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-gray-900 border border-gray-900 hover:bg-gray-800"
                    >
                      Resolve Dispute
                    </button>
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
