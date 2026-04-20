import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';

function AuctionRow({ a, user, navigate }) {
  return (
    <tr style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
      onClick={() => navigate(`/auctions/${a.auctionId}`)}>
      <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>{a.auctionId?.slice(0, 8)}…</td>
      <td style={{ padding: '6px 8px' }}>{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
      <td style={{ padding: '6px 8px' }}>{a.bidCount}</td>
      <td style={{ padding: '6px 8px', fontSize: 12 }}>
        {a.leadingBidderId === user?.userId
          ? <span style={{ color: 'green', fontWeight: 'bold' }}>Winning</span>
          : <span style={{ color: '#c00' }}>Outbid</span>}
      </td>
      <td style={{ padding: '6px 8px', fontSize: 12 }}>{new Date(a.endTime).toLocaleString()}</td>
    </tr>
  );
}

function SoldRow({ a, navigate }) {
  return (
    <tr style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
      onClick={() => navigate(`/auctions/${a.auctionId}`)}>
      <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>{a.auctionId?.slice(0, 8)}…</td>
      <td style={{ padding: '6px 8px' }}>{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
      <td style={{ padding: '6px 8px', fontSize: 12, color: '#0969da', fontWeight: 'bold' }}>{a.status}</td>
      <td style={{ padding: '6px 8px', fontSize: 12 }}>{new Date(a.endTime).toLocaleString()}</td>
    </tr>
  );
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/auctions/my-bids').catch(() => []),
      api.get('/payments/wallet').catch(() => null),
    ]).then(([bids, w]) => {
      if (cancelled) return;
      setAuctions(bids ?? []);
      setWallet(w);
    }).catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [user?.userId]);

  const active = auctions.filter((a) => a.status === 'ACTIVE');
  const won = auctions.filter((a) =>
    (a.status === 'SOLD' || a.status === 'COMPLETED') && a.leadingBidderId === user?.userId
  );
  const other = auctions.filter((a) =>
    !['ACTIVE'].includes(a.status) &&
    !((a.status === 'SOLD' || a.status === 'COMPLETED') && a.leadingBidderId === user?.userId)
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>My Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {wallet && (
        <div style={{ background: '#f6f8fa', border: '1px solid #ddd', borderRadius: 8, padding: '16px 20px', marginBottom: 24, display: 'inline-block' }}>
          <span style={{ fontSize: 14, color: '#555' }}>Wallet Balance: </span>
          <strong style={{ fontSize: 20 }}>€{wallet.balance}</strong>
          {' '}<Link to="/wallet" style={{ fontSize: 13 }}>Manage →</Link>
        </div>
      )}

      <h3>Active Bids ({active.length})</h3>
      {active.length === 0 ? <p style={{ color: '#888' }}>No active bids.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Auction</th>
              <th style={{ padding: '6px 8px' }}>Current Price</th>
              <th style={{ padding: '6px 8px' }}>Bids</th>
              <th style={{ padding: '6px 8px' }}>Your Status</th>
              <th style={{ padding: '6px 8px' }}>Ends</th>
            </tr>
          </thead>
          <tbody>{active.map((a) => <AuctionRow key={a.auctionId} a={a} user={user} navigate={navigate} />)}</tbody>
        </table>
      )}

      <h3>Won Auctions ({won.length})</h3>
      {won.length === 0 ? <p style={{ color: '#888' }}>No won auctions yet.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Auction</th>
              <th style={{ padding: '6px 8px' }}>Final Price</th>
              <th style={{ padding: '6px 8px' }}>Status</th>
              <th style={{ padding: '6px 8px' }}>Ended</th>
            </tr>
          </thead>
          <tbody>{won.map((a) => <SoldRow key={a.auctionId} a={a} navigate={navigate} />)}</tbody>
        </table>
      )}

      {other.length > 0 && (
        <>
          <h3>Other ({other.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Auction</th>
                <th style={{ padding: '6px 8px' }}>Final Price</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
                <th style={{ padding: '6px 8px' }}>Ended</th>
              </tr>
            </thead>
            <tbody>{other.map((a) => <SoldRow key={a.auctionId} a={a} navigate={navigate} />)}</tbody>
          </table>
        </>
      )}
    </div>
  );
}
