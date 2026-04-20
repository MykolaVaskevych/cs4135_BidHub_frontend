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

  return (
    <div>
      <h2>Auctions</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Search auctions..." value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
          style={{ flex: 1 }} />
        <button onClick={doSearch}>Search</button>
      </div>

      {auctions.length === 0 ? (
        <p>No active auctions found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th>Title</th>
              <th>Current Price</th>
              <th>Buy Now</th>
              <th>Bids</th>
              <th>Status</th>
              <th>Ends</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => {
              const lst = listings[a.listingId];
              return (
                <tr key={a.auctionId}
                  style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                  onClick={() => navigate(`/auctions/${a.auctionId}`)}>
                  <td>
                    {lst?.title ?? <span style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 12 }}>{a.auctionId.slice(0, 8)}…</span>}
                  </td>
                  <td>{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                  <td>{a.buyNowPrice ? `${a.buyNowPrice.amount} ${a.buyNowPrice.currency}` : '-'}</td>
                  <td>{a.bidCount}</td>
                  <td>{a.status}</td>
                  <td>{new Date(a.endTime).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
