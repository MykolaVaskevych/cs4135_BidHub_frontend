import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function SearchPage() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const doSearch = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    api.get('/catalogue/categories')
      .then((data) => setCategories(data))
      .catch((err) => setError(err.body?.message || err.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (categoryId) params.append('category', categoryId);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    const qs = params.toString() ? `?${params.toString()}` : '';

    api.get(`/catalogue/search${qs}`)
      .then((data) => { if (!cancelled) setListings(data.content || []); })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return (
    <div>
      <h2>Search Listings</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Search listings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
          style={{ flex: 2 }}
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ flex: 1 }}
          type="number"
        />
        <input
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ flex: 1 }}
          type="number"
        />
        <button onClick={doSearch}>Search</button>
      </div>

      {listings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th>Title</th>
              <th>Current Price</th>
              <th>Status</th>
              <th>Ends</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.listingId} style={{ borderBottom: '1px solid #eee' }}>
                <td>{l.title}</td>
                <td>{l.currentPrice} {l.currency}</td>
                <td>{l.status}</td>
                <td>{new Date(l.endTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}