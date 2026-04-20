import { useState, useEffect } from 'react';
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
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/auctions/all')
      .then((data) => { if (!cancelled) setAuctions(data ?? []); })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h3>All Auctions ({auctions.length})</h3>
      {auctions.length === 0 ? <p style={{ color: '#888' }}>No auctions yet.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>ID</th>
              <th style={{ padding: '6px 8px' }}>Status</th>
              <th style={{ padding: '6px 8px' }}>Current Price</th>
              <th style={{ padding: '6px 8px' }}>Bids</th>
              <th style={{ padding: '6px 8px' }}>Ends</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
