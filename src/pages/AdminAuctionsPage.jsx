import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

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
    if (!globalThis.confirm('Remove this auction?')) return;
    setMsg(''); setError('');
    try {
      await api.post(`/auctions/${auctionId}/remove`);
      setMsg('Auction removed.');
      reload();
    } catch (err) { setError(err.body?.message || err.message); }
  }, []);

  const statusClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-700';
      case 'SOLD':
      case 'COMPLETED': return 'text-blue-700';
      case 'ENDED': return 'text-gray-500';
      case 'CANCELLED':
      case 'REMOVED': return 'text-red-600';
      case 'PENDING': return 'text-amber-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">All Auctions ({auctions.length})</h3>
      {msg && <p className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {auctions.length === 0 ? (
        <p className="text-sm text-gray-500">No auctions yet.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">ID</th>
                <th className="px-3 py-2 font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 font-medium text-gray-700">Current Price</th>
                <th className="px-3 py-2 font-medium text-gray-700">Bids</th>
                <th className="px-3 py-2 font-medium text-gray-700">Ends</th>
                <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((a) => (
                <tr key={a.auctionId} className="border-b border-gray-100">
                  <td className="px-3 py-2">
                    <Link to={`/auctions/${a.auctionId}`} className="font-mono text-xs text-gray-700 underline">
                      {a.auctionId?.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className={`px-3 py-2 font-medium ${statusClass(a.status)}`}>{a.status}</td>
                  <td className="px-3 py-2">{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                  <td className="px-3 py-2">{a.bidCount}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{new Date(a.endTime).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {a.status !== 'REMOVED' && (
                      <button
                        onClick={() => handleRemove(a.auctionId)}
                        className="px-2.5 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </button>
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
