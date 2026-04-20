import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';

export default function AuctionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [listing, setListing] = useState(null);
  const [watched, setWatched] = useState(false);
  const [hasAddress, setHasAddress] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const timerRef = useRef(null);

  const reload = () => setReloadKey((k) => k + 1);

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
        ]);
      })
      .then((results) => {
        if (!results || cancelled) return;
        const [lst, wl, addrs] = results;
        setListing(lst);
        setWatched(wl?.watchedAuctionIds?.includes(id));
        setHasAddress(!Array.isArray(addrs) || addrs.length > 0);
        setDefaultAddress(Array.isArray(addrs) ? (addrs.find((a) => a.isDefault) ?? addrs[0] ?? null) : null);
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

  if (!auction && !error) return <p>Loading...</p>;
  if (!auction) return <p style={{ color: 'red' }}>{error}</p>;

  const isActive = auction.status === 'ACTIVE';
  const isBuyer = user?.role === 'BUYER';
  const isOwner = user?.userId === auction.sellerId;

  return (
    <div style={{ maxWidth: 640 }}>
      <h2>{listing?.title || 'Auction Detail'}</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {listing?.description && <p>{listing.description}</p>}

      {listing?.photos?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {listing.photos.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 4, background: '#eee' }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          ))}
        </div>
      )}

      <table style={{ marginBottom: 16 }}>
        <tbody>
          <tr><td><strong>Status</strong></td><td>{auction.status}</td></tr>
          <tr><td><strong>Current Price</strong></td><td>{auction.currentPrice?.amount} {auction.currentPrice?.currency}</td></tr>
          <tr><td><strong>Starting Price</strong></td><td>{auction.startingPrice?.amount} {auction.startingPrice?.currency}</td></tr>
          {auction.buyNowPrice && <tr><td><strong>Buy Now</strong></td><td>{auction.buyNowPrice.amount} {auction.buyNowPrice.currency}</td></tr>}
          <tr><td><strong>Bids</strong></td><td>{auction.bidCount}</td></tr>
          {auction.leadingBidderId && (
            <tr>
              <td><strong>Current Winner</strong></td>
              <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {auction.leadingBidderId === user?.userId
                  ? <span style={{ color: 'green', fontWeight: 'bold' }}>You are winning!</span>
                  : `${auction.leadingBidderId.slice(0, 8)}…`}
              </td>
            </tr>
          )}
          <tr><td><strong>Ends</strong></td><td>{new Date(auction.endTime).toLocaleString()}</td></tr>
          {auction.status === 'ACTIVE' && timeLeft && (
            <tr>
              <td><strong>Time Left</strong></td>
              <td style={{ fontWeight: 'bold', color: timeLeft.includes('h') && !timeLeft.includes('d') ? '#c00' : 'inherit' }}>
                {timeLeft}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {isActive && (
          <button onClick={handleWatchToggle}>
            {watched ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        )}
        {isActive && isOwner && auction.bidCount === 0 && (
          <button onClick={handleCancel} style={{ background: '#fee', color: '#c00' }}>Cancel Auction</button>
        )}
      </div>

      {isActive && isBuyer && !hasAddress && (
        <div style={{ padding: '12px 16px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 6, marginBottom: 16 }}>
          <strong>You need a delivery address to bid.</strong>
          {' '}Go to <a href="/profile">Profile / Addresses</a> and add an address first.
        </div>
      )}

      {isActive && isBuyer && hasAddress && (
        <div style={{ marginBottom: 16 }}>
          <h3>Place a Bid</h3>
          <small style={{ color: '#666', display: 'block', marginBottom: 8 }}>
            Your bid must beat the current price. If the auction ends and your bid is the highest
            but below the reserve price, the item won't sell.
          </small>
          {(() => {
            const minBid = ((auction.currentPrice?.amount ?? 0) * 1 + 0.01).toFixed(2);
            return (
              <form onSubmit={handleBid} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" step="0.01" min={minBid}
                  placeholder={`Min €${minBid}`}
                  value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} required />
                <button type="submit">Place Bid</button>
                <small style={{ color: '#888' }}>Must be &gt; €{auction.currentPrice?.amount}</small>
              </form>
            );
          })()}
        </div>
      )}

      {isActive && isBuyer && hasAddress && auction.buyNowPrice && (
        <div>
          <h3>Buy Now</h3>
          <p style={{ fontSize: 13, color: '#555' }}>
            Skip the auction — pay the Buy Now price to win immediately. A delivery job will be
            created automatically once payment is confirmed.
          </p>
          {defaultAddress && (
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
              Delivering to: <strong>{defaultAddress.addressLine1}, {defaultAddress.city}, {defaultAddress.eircode}</strong>
              {' '}(<a href="/profile">change</a>)
            </p>
          )}
          <button onClick={handleBuyNow}>Buy Now — {auction.buyNowPrice.amount} {auction.buyNowPrice.currency}</button>
        </div>
      )}
    </div>
  );
}
