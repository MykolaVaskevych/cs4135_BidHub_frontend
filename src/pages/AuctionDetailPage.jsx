import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';

export default function AuctionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [listing, setListing] = useState(null);
  const [sellerName, setSellerName] = useState('');
  const [watched, setWatched] = useState(false);
  const [hasAddress, setHasAddress] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!previewPhoto) return;
    const onKey = (e) => { if (e.key === 'Escape') setPreviewPhoto(null); };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [previewPhoto]);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    if (timeLeft !== 'Ended' || auction?.status !== 'ACTIVE') return;
    const poll = setInterval(reload, 3000);
    return () => clearInterval(poll);
  }, [timeLeft, auction?.status]);

  useEffect(() => {
    if (!auction?.endTime || auction.status !== 'ACTIVE') {
      clearInterval(timerRef.current);
      return;
    }
    const tick = () => {
      const diff = new Date(auction.endTime) - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); clearInterval(timerRef.current); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [auction?.endTime, auction?.status]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/auctions/${id}`)
      .then((a) => {
        if (cancelled) return;
        setAuction(a);
        return Promise.all([
          api.get(`/auctions/listings/${a.listingId}`),
          api.get('/auctions/watchlists/me'),
          api.get('/accounts/me/addresses').catch(() => null),
          api.get(`/accounts/${a.sellerId}`).catch(() => null),
        ]);
      })
      .then((results) => {
        if (!results || cancelled) return;
        const [lst, wl, addrs, seller] = results;
        setListing(lst);
        setWatched(wl?.watchedAuctionIds?.includes(id));
        setHasAddress(!Array.isArray(addrs) || addrs.length > 0);
        setDefaultAddress(Array.isArray(addrs) ? (addrs.find((a) => a.isDefault) ?? addrs[0] ?? null) : null);
        if (seller) setSellerName(`${seller.firstName} ${seller.lastName}`.trim());
        return api.get(`/auctions/${id}/bids`).catch(() => []);
      })
      .then((bidList) => {
        if (cancelled || !bidList) return;
        setBids(bidList ?? []);
      })
      .catch((err) => { if (!cancelled) setError(err.body?.detail || err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const handleBid = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await api.post(`/auctions/${id}/bids`, { amount: parseFloat(bidAmount) });
      setBidAmount('');
      setMsg('Bid placed successfully');
      reload();
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  };

  const handleBuyNow = async () => {
    setMsg(''); setError('');
    try {
      await api.post(`/auctions/${id}/buy-now`);
      setMsg('Purchase successful!');
      reload();
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  };

  const handleCancel = async () => {
    setMsg(''); setError('');
    try {
      await api.post(`/auctions/${id}/cancel`);
      setMsg('Auction cancelled');
      reload();
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  };

  const handleReport = async () => {
    const reason = window.prompt('Reason for reporting this listing:');
    if (!reason) return;
    setMsg(''); setError('');
    try {
      await api.post('/admin/reports', { targetId: auction.sellerId, reason });
      setMsg('Report submitted. An admin will review it.');
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  };

  const handleWatchToggle = async () => {
    setMsg(''); setError('');
    try {
      if (watched) {
        await api.del(`/auctions/watchlists/me/${id}`);
        setWatched(false);
      } else {
        await api.post(`/auctions/watchlists/me/${id}`);
        setWatched(true);
      }
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  };

  if (!auction && !error) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!auction) return <p className="text-sm text-red-600">{error}</p>;

  const isActive = auction.status === 'ACTIVE';
  const isBuyer = user?.role === 'BUYER';
  const isOwner = user?.userId === auction.sellerId;
  const isEndingSoon = timeLeft && !timeLeft.includes('d') && timeLeft.includes('h');

  const statusClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-700';
      case 'ENDED': return 'text-gray-500';
      case 'CANCELLED': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  const btnBase = 'px-3 py-1.5 text-sm font-medium border';
  const btnPrimary = `${btnBase} text-white bg-gray-900 border-gray-900 hover:bg-gray-800`;
  const btnSecondary = `${btnBase} text-gray-900 bg-white border-gray-300 hover:bg-gray-50`;
  const btnDanger = `${btnBase} text-red-700 bg-red-50 border-red-300 hover:bg-red-100`;
  const btnSubtle = `${btnBase} text-gray-500 bg-white border-gray-300 hover:bg-gray-50 text-xs`;

  const rowLabel = 'py-1.5 pr-4 text-sm text-gray-500 font-medium align-top w-40';
  const rowValue = 'py-1.5 text-sm text-gray-900';

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-2">{listing?.title || 'Auction Detail'}</h2>
      {msg && <p role="status" className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      {listing?.description && <p className="text-sm text-gray-700 mb-4">{listing.description}</p>}

      {listing?.photos?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {listing.photos.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPreviewPhoto(url)}
              className="p-0 border-0 bg-transparent cursor-zoom-in"
              aria-label="Preview photo"
            >
              <img
                src={url}
                alt=""
                className="w-64 h-48 object-cover bg-gray-100 border border-gray-200 hover:opacity-90 transition-opacity"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </button>
          ))}
        </div>
      )}

      <table className="mb-4 w-full">
        <tbody>
          <tr><td className={rowLabel}>Seller</td><td className={rowValue}>{sellerName || '-'}</td></tr>
          <tr>
            <td className={rowLabel}>Status</td>
            <td className={`${rowValue} font-medium ${statusClass(auction.status)}`}>{auction.status}</td>
          </tr>
          <tr>
            <td className={rowLabel}>Current Price</td>
            <td className={`${rowValue} font-semibold`}>{auction.currentPrice?.amount} {auction.currentPrice?.currency}</td>
          </tr>
          <tr><td className={rowLabel}>Starting Price</td><td className={rowValue}>{auction.startingPrice?.amount} {auction.startingPrice?.currency}</td></tr>
          {auction.buyNowPrice && (
            <tr><td className={rowLabel}>Buy Now</td><td className={rowValue}>{auction.buyNowPrice.amount} {auction.buyNowPrice.currency}</td></tr>
          )}
          <tr><td className={rowLabel}>Bids</td><td className={rowValue}>{auction.bidCount}</td></tr>
          {auction.leadingBidderId && (
            <tr>
              <td className={rowLabel}>Current Winner</td>
              <td className={rowValue}>
                {auction.leadingBidderId === user?.userId
                  ? <span className="text-green-700 font-semibold">You are winning</span>
                  : <span className="text-gray-600">Someone else</span>}
              </td>
            </tr>
          )}
          <tr><td className={rowLabel}>Ends</td><td className={`${rowValue} text-gray-600`}>{new Date(auction.endTime).toLocaleString()}</td></tr>
          {auction.status === 'ACTIVE' && timeLeft && (
            <tr>
              <td className={rowLabel}>Time Left</td>
              <td className={`${rowValue} font-semibold ${isEndingSoon ? 'text-red-600' : 'text-gray-900'}`}>{timeLeft}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex gap-2 mb-4 flex-wrap">
        {isActive && (
          <button onClick={handleWatchToggle} className={btnSecondary}>
            {watched ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        )}
        {isActive && isOwner && auction.bidCount === 0 && (
          <button onClick={handleCancel} className={btnDanger}>Cancel Auction</button>
        )}
        {!isOwner && (
          <button onClick={handleReport} className={btnSubtle}>Report Listing</button>
        )}
      </div>

      {isActive && isBuyer && !hasAddress && (
        <div className="p-3 mb-4 text-sm bg-amber-50 border border-amber-300 text-amber-900">
          <strong>You need a delivery address to bid.</strong>{' '}
          Go to <Link to="/profile" className="underline">Profile / Addresses</Link> and add one first.
        </div>
      )}

      {isActive && isBuyer && hasAddress && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Place a Bid</h3>
          <p className="text-xs text-gray-500 mb-2">
            Your bid must beat the current price. If the auction ends and your bid is the highest
            but below the reserve price, the item won't sell.
          </p>
          {(() => {
            const minBid = ((auction.currentPrice?.amount ?? 0) * 1 + 0.01).toFixed(2);
            return (
              <form onSubmit={handleBid} className="flex gap-2 items-center flex-wrap">
                <input
                  type="number" step="0.01" min={minBid}
                  placeholder={`Min €${minBid}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  required
                  className="px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-gray-500 w-40"
                />
                <button type="submit" className={btnPrimary}>Place Bid</button>
                <span className="text-xs text-gray-500">Must be &gt; €{auction.currentPrice?.amount}</span>
              </form>
            );
          })()}
        </div>
      )}

      {isActive && isBuyer && hasAddress && auction.buyNowPrice && (
        <div className="mb-6 p-3 border border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold mb-1">Buy Now</h3>
          <p className="text-sm text-gray-600 mb-2">
            Skip the auction — pay the Buy Now price to win immediately. A delivery job will be
            created automatically once payment is confirmed.
          </p>
          {defaultAddress && (
            <p className="text-xs text-gray-600 mb-2">
              Delivering to: <strong>{defaultAddress.addressLine1}, {defaultAddress.city}, {defaultAddress.eircode}</strong>
              {' '}(<Link to="/profile" className="underline">change</Link>)
            </p>
          )}
          <button onClick={handleBuyNow} className={btnPrimary}>
            Buy Now — {auction.buyNowPrice.amount} {auction.buyNowPrice.currency}
          </button>
        </div>
      )}

      {bids.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Bid History ({bids.length})</h3>
          <div className="border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-3 py-2 font-medium text-gray-700 w-12">#</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Amount</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Time</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Winner</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((b, i) => (
                  <tr key={b.bidId} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-xs text-gray-500">{i + 1}</td>
                    <td className={`px-3 py-2 ${b.isWinning ? 'font-semibold' : ''}`}>
                      {b.amount?.amount} {b.amount?.currency}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {b.placedAt ? new Date(b.placedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {b.isWinning && <span className="text-green-700">★ winning</span>}
                      {b.bidderId === user?.userId && <span className="text-gray-500"> (you)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewPhoto && (
        <button
          type="button"
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out border-0"
          aria-label="Close preview"
        >
          <img
            src={previewPhoto}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </button>
      )}
    </div>
  );
}
