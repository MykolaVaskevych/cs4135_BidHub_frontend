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
      <h3>Disputed Deliveries</h3>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
        These delivery jobs have an active dispute raised by the buyer. Resolving moves the job
        to Confirmed and releases escrow to the seller.
      </p>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {jobs.length === 0 ? (
        <p style={{ color: '#888' }}>No disputed deliveries.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Job ID</th>
              <th style={{ padding: '6px 8px' }}>Buyer ID</th>
              <th style={{ padding: '6px 8px' }}>Seller ID</th>
              <th style={{ padding: '6px 8px' }}>Created</th>
              <th style={{ padding: '6px 8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.deliveryJobId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>{j.deliveryJobId?.slice(0, 8)}…</td>
                <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>{j.buyerId?.slice(0, 8)}…</td>
                <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>{j.sellerId?.slice(0, 8)}…</td>
                <td style={{ padding: '6px 8px', fontSize: 12 }}>{j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '6px 8px' }}>
                  <button onClick={() => handleResolve(j.deliveryJobId)}>Resolve Dispute</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
