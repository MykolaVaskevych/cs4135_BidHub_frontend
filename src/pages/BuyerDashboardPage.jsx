import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';

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

  const thCls = 'px-3 py-2 font-medium text-gray-700';
  const rowCls = 'border-b border-gray-100 hover:bg-gray-50 cursor-pointer';

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">My Dashboard</h2>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {wallet && (
        <div className="inline-block bg-gray-50 border border-gray-200 px-5 py-4 mb-6">
          <span className="text-sm text-gray-500">Wallet Balance: </span>
          <strong className="text-xl text-gray-900">€{wallet.balance}</strong>
          {' '}<Link to="/wallet" className="text-sm text-gray-700 underline ml-2">Manage →</Link>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-3">Active Bids ({active.length})</h3>
      {active.length === 0 ? (
        <p className="text-sm text-gray-500 mb-6">No active bids.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className={thCls}>Auction</th>
                <th className={thCls}>Current Price</th>
                <th className={thCls}>Bids</th>
                <th className={thCls}>Your Status</th>
                <th className={thCls}>Ends</th>
              </tr>
            </thead>
            <tbody>
              {active.map((a) => (
                <tr key={a.auctionId} onClick={() => navigate(`/auctions/${a.auctionId}`)} className={rowCls}>
                  <td className="px-3 py-2 font-mono text-xs">{a.auctionId?.slice(0, 8)}…</td>
                  <td className="px-3 py-2">{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                  <td className="px-3 py-2">{a.bidCount}</td>
                  <td className="px-3 py-2 text-xs">
                    {a.leadingBidderId === user?.userId
                      ? <span className="text-green-700 font-semibold">Winning</span>
                      : <span className="text-red-600 font-semibold">Outbid</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{new Date(a.endTime).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-3">Won Auctions ({won.length})</h3>
      {won.length === 0 ? (
        <p className="text-sm text-gray-500 mb-6">No won auctions yet.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className={thCls}>Auction</th>
                <th className={thCls}>Final Price</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Ended</th>
              </tr>
            </thead>
            <tbody>
              {won.map((a) => (
                <tr key={a.auctionId} onClick={() => navigate(`/auctions/${a.auctionId}`)} className={rowCls}>
                  <td className="px-3 py-2 font-mono text-xs">{a.auctionId?.slice(0, 8)}…</td>
                  <td className="px-3 py-2">{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-blue-700">{a.status}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{new Date(a.endTime).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {other.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-3">Other ({other.length})</h3>
          <div className="border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className={thCls}>Auction</th>
                  <th className={thCls}>Final Price</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Ended</th>
                </tr>
              </thead>
              <tbody>
                {other.map((a) => (
                  <tr key={a.auctionId} onClick={() => navigate(`/auctions/${a.auctionId}`)} className={rowCls}>
                    <td className="px-3 py-2 font-mono text-xs">{a.auctionId?.slice(0, 8)}…</td>
                    <td className="px-3 py-2">{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-blue-700">{a.status}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{new Date(a.endTime).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
