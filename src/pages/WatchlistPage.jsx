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

  const statusClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-700';
      case 'ENDED': return 'text-gray-500';
      case 'CANCELLED': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Watchlist</h2>
      {msg && <p role="status" className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      {auctions.length === 0 ? (
        <p className="text-sm text-gray-500">Your watchlist is empty.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Auction</th>
                <th className="px-3 py-2 font-medium text-gray-700">Current Price</th>
                <th className="px-3 py-2 font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 font-medium text-gray-700">Ends</th>
                <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((a) => (
                <tr
                  key={a.auctionId}
                  onClick={() => navigate(`/auctions/${a.auctionId}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-3 py-2 font-mono text-xs">{a.auctionId.slice(0, 8)}…</td>
                  <td className="px-3 py-2">{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                  <td className={`px-3 py-2 font-medium ${statusClass(a.status)}`}>{a.status}</td>
                  <td className="px-3 py-2 text-gray-600">{new Date(a.endTime).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={(e) => handleRemove(a.auctionId, e)}
                      className="px-2 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50"
                    >
                      Remove
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
