import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const STATUS_COLOR = {
  ACTIVE: '#1a7f37',
  SOLD: '#0969da',
  ENDED: '#888',
  CANCELLED: '#c00',
  PENDING: '#9a6700',
  REMOVED: '#c00',
  COMPLETED: '#0969da',
};

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    api.get('/auctions/all')
      .then((data) => { if (!cancelled) setAuctions(data ?? []); })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleRemove = useCallback(async (auctionId) => {
    if (!window.confirm('Remove this auction?')) return;
    setMsg(''); setError('');
    try {
      await api.post(`/auctions/${auctionId}/remove`);
      setMsg('Auction removed.');
      reload();
    } catch (err) { setError(err.body?.message || err.message); }
  }, []);

  return (
    <div>
      <h3>All Auctions ({auctions.length})</h3>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {auctions.length === 0 ? <p style={{ color: '#888' }}>No auctions yet.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>ID</th>
              <th style={{ padding: '6px 8px' }}>Status</th>
              <th style={{ padding: '6px 8px' }}>Current Price</th>
              <th style={{ padding: '6px 8px' }}>Bids</th>
              <th style={{ padding: '6px 8px' }}>Ends</th>
              <th style={{ padding: '6px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => (
              <tr key={a.auctionId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>
                  <a href={`/auctions/${a.auctionId}`}>{a.auctionId?.slice(0, 8)}…</a>
                </td>
                <td style={{ padding: '6px 8px', color: STATUS_COLOR[a.status] ?? '#333', fontWeight: 'bold', fontSize: 13 }}>
                  {a.status}
                </td>
                <td style={{ padding: '6px 8px' }}>{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                <td style={{ padding: '6px 8px' }}>{a.bidCount}</td>
                <td style={{ padding: '6px 8px', fontSize: 12 }}>{new Date(a.endTime).toLocaleString()}</td>
                <td style={{ padding: '6px 8px' }}>
                  {a.status !== 'REMOVED' && (
                    <button onClick={() => handleRemove(a.auctionId)}
                      style={{ fontSize: 12, background: '#fee', color: '#c00', border: '1px solid #fcc', padding: '2px 8px' }}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
