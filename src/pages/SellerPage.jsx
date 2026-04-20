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
      .then((data) => {
        if (!cancelled) setMyAuctions(data ?? []);
      })
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
      setMsg('Listing created! Now set up the auction below.');
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
      setMsg('Auction started!');
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

  return (
    <div>
      <h2>My Listings</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!createdListing ? (
        <>
          <h3>Create New Listing</h3>
          <form onSubmit={handleCreateListing} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480, marginBottom: 32 }}>
            <input placeholder="Title" value={listingForm.title} onChange={lf('title')} required />
            <textarea placeholder="Description" value={listingForm.description} onChange={lf('description')} required rows={3} />
            <select value={listingForm.categoryId} onChange={lf('categoryId')} required>
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
            <input placeholder="Photo URLs (comma-separated, optional)" value={listingForm.photos} onChange={lf('photos')} />
            <small style={{ color: '#888' }}>Use direct image URLs ending in .jpg/.png (e.g. https://i.imgur.com/abc.jpg). Leave blank for placeholder.</small>
            <button type="submit" style={{ alignSelf: 'flex-start' }}>Create Listing</button>
          </form>
        </>
      ) : (
        <>
          <h3>Start Auction for: <em>{createdListing.title}</em></h3>
          <form onSubmit={handleCreateAuction} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480, marginBottom: 32 }}>
            <input type="number" step="1" min="1" placeholder="Starting Price (€)" value={auctionForm.startingPrice} onChange={af('startingPrice')} required />
            <input type="number" step="1" min={auctionForm.startingPrice || 1} placeholder="Reserve Price (€)" value={auctionForm.reservePrice} onChange={af('reservePrice')} required />
            <small style={{ color: '#888', marginTop: -4 }}>Reserve price: minimum you'll accept. If bids don't reach it, the item won't sell.</small>
            <input type="number" step="1" min={auctionForm.startingPrice ? parseFloat(auctionForm.startingPrice) + 1 : 1} placeholder="Buy Now Price (€, optional)" value={auctionForm.buyNowPrice} onChange={af('buyNowPrice')} />
            <label style={{ fontSize: 13, color: '#555' }}>Duration</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: '40s (test)', ms: 40000 },
                { label: '1d', ms: 86400000 },
                { label: '3d', ms: 3 * 86400000 },
                { label: '5d', ms: 5 * 86400000 },
                { label: '7d', ms: 7 * 86400000 },
              ].map(({ label, ms }) => (
                <button key={ms} type="button"
                  onClick={() => setAuctionForm({ ...auctionForm, durationMs: ms, endPreview: new Date(Date.now() + ms).toLocaleString() })}
                  style={{
                    padding: '6px 16px', borderRadius: 4, cursor: 'pointer',
                    background: auctionForm.durationMs === ms ? '#333' : '#fff',
                    color: auctionForm.durationMs === ms ? '#fff' : '#333',
                    border: ms === 20000 ? '1px solid #f90' : '1px solid #999',
                  }}>
                  {label}
                </button>
              ))}
            </div>
            {auctionForm.endPreview && (
              <small style={{ color: '#666' }}>Ends: {auctionForm.endPreview}</small>
            )}
            <input type="hidden" required value={auctionForm.durationMs}
              onChange={() => {}} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit">Start Auction</button>
              <button type="button" onClick={() => setCreatedListing(null)}>Cancel</button>
            </div>
          </form>
        </>
      )}

      {editingAuction && (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '16px 20px', marginBottom: 24, background: '#fafafa' }}>
          <h3>Edit Listing</h3>
          <form onSubmit={handleEditListing} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
            <input placeholder="Title" value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
            <textarea placeholder="Description" value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            <input placeholder="Photo URLs (comma-separated)" value={editForm.photos}
              onChange={(e) => setEditForm({ ...editForm, photos: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingAuction(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <h3>My Auctions</h3>
      {myAuctions.length === 0 ? (
        <p>No auctions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th>Auction</th>
              <th>Current Price</th>
              <th>Bids</th>
              <th>Status</th>
              <th>Ends</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myAuctions.map((a) => (
              <tr key={a.auctionId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}
                  onClick={() => navigate(`/auctions/${a.auctionId}`)}>
                  {a.auctionId.slice(0, 8)}…
                </td>
                <td>{a.currentPrice?.amount} {a.currentPrice?.currency}</td>
                <td>{a.bidCount}</td>
                <td>{a.status}</td>
                <td>{new Date(a.endTime).toLocaleString()}</td>
                <td>
                  {(a.status === 'ENDED' || (a.status === 'ACTIVE' && a.bidCount === 0)) && (
                    <button onClick={() => startEdit(a)} style={{ fontSize: 12 }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
