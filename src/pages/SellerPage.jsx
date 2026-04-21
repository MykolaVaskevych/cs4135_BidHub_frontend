import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';

export default function SellerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [listingForm, setListingForm] = useState({ title: '', description: '', categoryId: '', photos: '' });
  const [createdListing, setCreatedListing] = useState(null);
  const [auctionForm, setAuctionForm] = useState({ startingPrice: '', reservePrice: '', buyNowPrice: '', durationMs: '', endPreview: '' });
  const [editingAuction, setEditingAuction] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', photos: '' });

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    api.get('/categories')
      .then((data) => { if (!cancelled) setCategories(data?.content ?? data ?? []); })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get('/auctions/my-sales')
      .then((data) => { if (!cancelled) setMyAuctions(data ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [reloadKey, user?.userId]);

  const validateImageUrls = (urls) =>
    Promise.all(urls.map((url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    })));

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      const photos = listingForm.photos.split(',').map((s) => s.trim()).filter(Boolean);
      if (photos.length > 0) {
        const results = await validateImageUrls(photos);
        const badUrls = photos.filter((_, i) => !results[i]);
        if (badUrls.length > 0) {
          setError(`These URLs failed to load: ${badUrls.join(', ')}`);
          return;
        }
      }
      const data = await api.post('/auctions/listings', {
        title: listingForm.title,
        description: listingForm.description,
        categoryId: listingForm.categoryId,
        photos: photos.length ? photos : ['https://placehold.co/400x300'],
      });
      setCreatedListing(data);
      setMsg('Listing created. Now set up the auction below.');
    } catch (err) { setError(err.body?.message || err.message); }
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    const start = parseFloat(auctionForm.startingPrice);
    const reserve = parseFloat(auctionForm.reservePrice);
    const buyNow = auctionForm.buyNowPrice ? parseFloat(auctionForm.buyNowPrice) : null;
    if (reserve < start) { setError('Reserve price must be ≥ starting price'); return; }
    if (buyNow !== null && buyNow <= start) { setError('Buy Now price must be > starting price'); return; }
    if (!auctionForm.durationMs) { setError('Select a duration'); return; }
    try {
      const body = {
        listingId: createdListing.listingId,
        startingPrice: start,
        reservePrice: reserve,
        endTime: new Date(Date.now() + auctionForm.durationMs).toISOString(),
      };
      if (buyNow !== null) body.buyNowPrice = buyNow;
      await api.post('/auctions', body);
      setMsg('Auction started.');
      setCreatedListing(null);
      setListingForm({ title: '', description: '', categoryId: '', photos: '' });
      setAuctionForm({ startingPrice: '', reservePrice: '', buyNowPrice: '', durationMs: '', endPreview: '' });
      reload();
    } catch (err) { setError(err.body?.detail || err.body?.message || err.message); }
  };

  const lf = (field) => (e) => setListingForm({ ...listingForm, [field]: e.target.value });
  const af = (field) => (e) => setAuctionForm({ ...auctionForm, [field]: e.target.value });

  const startEdit = async (auction) => {
    setMsg(''); setError('');
    try {
      const listing = await api.get(`/auctions/listings/${auction.listingId}`);
      setEditingAuction(auction);
      setEditForm({
        title: listing.title ?? '',
        description: listing.description ?? '',
        photos: (listing.photos ?? []).join(', '),
      });
    } catch (err) { setError(err.body?.message || err.message); }
  };

  const handleEditListing = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      const photos = editForm.photos.split(',').map((s) => s.trim()).filter(Boolean);
      await api.put(`/auctions/listings/${editingAuction.listingId}`, {
        title: editForm.title,
        description: editForm.description,
        photos,
      });
      setMsg('Listing updated.');
      setEditingAuction(null);
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

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500';
  const btnBase = 'px-3 py-1.5 text-sm font-medium border';
  const btnPrimary = `${btnBase} text-white bg-gray-900 border-gray-900 hover:bg-gray-800`;
  const btnSecondary = `${btnBase} text-gray-900 bg-white border-gray-300 hover:bg-gray-50`;

  const durationOptions = [
    { label: '40s (test)', ms: 40000, isTest: true },
    { label: '1 day', ms: 86400000 },
    { label: '3 days', ms: 3 * 86400000 },
    { label: '5 days', ms: 5 * 86400000 },
    { label: '7 days', ms: 7 * 86400000 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Listings</h2>
      {msg && <p className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!createdListing ? (
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Create New Listing</h3>
          <form onSubmit={handleCreateListing} className="flex flex-col gap-3 max-w-md">
            <input placeholder="Title" value={listingForm.title} onChange={lf('title')} required className={inputClass} />
            <textarea placeholder="Description" value={listingForm.description} onChange={lf('description')} required rows={3} className={inputClass} />
            <select value={listingForm.categoryId} onChange={lf('categoryId')} required className={inputClass}>
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
            <input placeholder="Photo URLs (comma-separated, optional)" value={listingForm.photos} onChange={lf('photos')} className={inputClass} />
            <p className="text-xs text-gray-500 -mt-1">
              Use direct image URLs ending in .jpg/.png (e.g. https://i.imgur.com/abc.jpg). Leave blank for placeholder.
            </p>
            <button type="submit" className={`${btnPrimary} self-start`}>Create Listing</button>
          </form>
        </section>
      ) : (
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-3">
            Start Auction for: <span className="italic font-normal">{createdListing.title}</span>
          </h3>
          <form onSubmit={handleCreateAuction} className="flex flex-col gap-3 max-w-md">
            <input type="number" step="1" min="1" placeholder="Starting Price (€)"
              value={auctionForm.startingPrice} onChange={af('startingPrice')} required className={inputClass} />
            <input type="number" step="1" min={auctionForm.startingPrice || 1} placeholder="Reserve Price (€)"
              value={auctionForm.reservePrice} onChange={af('reservePrice')} required className={inputClass} />
            <p className="text-xs text-gray-500 -mt-1">
              Reserve price: minimum you'll accept. If bids don't reach it, the item won't sell.
            </p>
            <input type="number" step="1"
              min={auctionForm.startingPrice ? parseFloat(auctionForm.startingPrice) + 1 : 1}
              placeholder="Buy Now Price (€, optional)"
              value={auctionForm.buyNowPrice} onChange={af('buyNowPrice')} className={inputClass} />

            <label className="text-sm text-gray-700 font-medium mt-1">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {durationOptions.map(({ label, ms, isTest }) => {
                const active = auctionForm.durationMs === ms;
                const base = 'px-4 py-1.5 text-sm border cursor-pointer';
                const activeCls = 'bg-gray-900 text-white border-gray-900';
                const inactiveCls = 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50';
                const testCls = isTest && !active ? 'border-amber-500 text-amber-700' : '';
                return (
                  <button key={ms} type="button"
                    onClick={() => setAuctionForm({ ...auctionForm, durationMs: ms, endPreview: new Date(Date.now() + ms).toLocaleString() })}
                    className={`${base} ${active ? activeCls : inactiveCls} ${testCls}`}>
                    {label}
                  </button>
                );
              })}
            </div>
            {auctionForm.endPreview && (
              <p className="text-xs text-gray-500">Ends: {auctionForm.endPreview}</p>
            )}
            <input type="hidden" required value={auctionForm.durationMs} onChange={() => {}} />

            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>Start Auction</button>
              <button type="button" onClick={() => setCreatedListing(null)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {editingAuction && (
        <section className="border border-gray-200 bg-gray-50 p-4 mb-6 max-w-md">
          <h3 className="text-lg font-semibold mb-3">Edit Listing</h3>
          <form onSubmit={handleEditListing} className="flex flex-col gap-3">
            <input placeholder="Title" value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required className={inputClass} />
            <textarea placeholder="Description" value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className={inputClass} />
            <input placeholder="Photo URLs (comma-separated)" value={editForm.photos}
              onChange={(e) => setEditForm({ ...editForm, photos: e.target.value })} className={inputClass} />
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>Save</button>
              <button type="button" onClick={() => setEditingAuction(null)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      <h3 className="text-lg font-semibold mb-3">My Auctions</h3>
      {myAuctions.length === 0 ? (
        <p className="text-sm text-gray-500">No auctions yet.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Auction</th>
                <th className="px-3 py-2 font-medium text-gray-700">Current Price</th>
                <th className="px-3 py-2 font-medium text-gray-700">Bids</th>
                <th className="px-3 py-2 font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 font-medium text-gray-700">Ends</th>
                <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myAuctions.map((a) => (
                <tr key={a.auctionId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/auctions/${a.auctionId}`)}
                      className="font-mono text-xs text-gray-700 underline bg-transparent border-0 cursor-pointer p-0"
                    >
                      {a.auctionId.slice(0, 8)}…
                    </button>
                  </td>
                  <td className="px-3 py-2">{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                  <td className="px-3 py-2">{a.bidCount}</td>
                  <td className={`px-3 py-2 font-medium ${statusClass(a.status)}`}>{a.status}</td>
                  <td className="px-3 py-2 text-gray-600">{new Date(a.endTime).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {(a.status === 'ENDED' || (a.status === 'ACTIVE' && a.bidCount === 0)) && (
                      <button onClick={() => startEdit(a)} className="text-xs text-gray-700 underline bg-transparent border-0 cursor-pointer">
                        Edit
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
