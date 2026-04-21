import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [listings, setListings] = useState({});
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();

  const doSearch = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    api.get(`/auctions/search${params}`)
      .then((data) => {
        if (cancelled) return;
        const list = data ?? [];
        setAuctions(list);
        return Promise.all(list.map((a) => api.get(`/auctions/listings/${a.listingId}`).catch(() => null)));
      })
      .then((lstData) => {
        if (!lstData || cancelled) return;
        const map = {};
        lstData.forEach((l) => { if (l) map[l.listingId] = l; });
        setListings(map);
      })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

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
      <h2 className="text-2xl font-bold mb-4">Auctions</h2>

      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex gap-2 mb-5">
        <input
          placeholder="Search auctions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={doSearch}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
        >
          Search
        </button>
      </div>

      {auctions.length === 0 ? (
        <p className="text-sm text-gray-500">No active auctions found.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Title</th>
                <th className="px-3 py-2 font-medium text-gray-700">Current Price</th>
                <th className="px-3 py-2 font-medium text-gray-700">Buy Now</th>
                <th className="px-3 py-2 font-medium text-gray-700">Bids</th>
                <th className="px-3 py-2 font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 font-medium text-gray-700">Ends</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((a) => {
                const lst = listings[a.listingId];
                return (
                  <tr
                    key={a.auctionId}
                    onClick={() => navigate(`/auctions/${a.auctionId}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-3 py-2">
                      {lst?.title ?? (
                        <span className="font-mono text-xs text-gray-400">{a.auctionId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                    <td className="px-3 py-2">{a.buyNowPrice ? `${a.buyNowPrice.amount} ${a.buyNowPrice.currency}` : '-'}</td>
                    <td className="px-3 py-2">{a.bidCount}</td>
                    <td className={`px-3 py-2 font-medium ${statusClass(a.status)}`}>{a.status}</td>
                    <td className="px-3 py-2 text-gray-600">{new Date(a.endTime).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
