import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function WatchlistPage() {
  const [auctions, setAuctions] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    api.get('/auctions/watchlists/me')
      .then((wl) => {
        if (cancelled) return;
        const ids = Array.from(wl?.watchedAuctionIds ?? []);
        if (ids.length === 0) { setAuctions([]); return; }
        return Promise.all(ids.map((id) => api.get(`/auctions/${id}`)));
      })
      .then((data) => { if (!cancelled && data) setAuctions(data); })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleRemove = async (auctionId, e) => {
    e.stopPropagation();
    setMsg(''); setError('');
    try {
      await api.del(`/auctions/watchlists/me/${auctionId}`);
      setMsg('Removed from watchlist');
      reload();
    } catch (err) { setError(err.body?.message || err.message); }
  };

  return (
    <div>
      <h2>Watchlist</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {auctions.length === 0 ? (
        <p>Your watchlist is empty.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th>Auction</th>
              <th>Current Price</th>
              <th>Status</th>
              <th>Ends</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => (
              <tr key={a.auctionId}
                style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                onClick={() => navigate(`/auctions/${a.auctionId}`)}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.auctionId.slice(0, 8)}…</td>
                <td>{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                <td>{a.status}</td>
                <td>{new Date(a.endTime).toLocaleString()}</td>
                <td>
                  <button onClick={(e) => handleRemove(a.auctionId, e)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
