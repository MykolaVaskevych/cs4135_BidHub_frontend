import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const doSearch = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    api.get(`/auctions/search${params}`)
      .then((data) => { if (!cancelled) setAuctions(data); })
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
            {auctions.map((a) => (
              <tr key={a.auctionId} style={{ borderBottom: '1px solid #eee' }}>
                <td>{a.listingId}</td>
                <td>{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                <td>{a.buyNowPrice ? `${a.buyNowPrice.amount} ${a.buyNowPrice.currency}` : '-'}</td>
                <td>{a.bidCount}</td>
                <td>{a.status}</td>
                <td>{new Date(a.endTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
