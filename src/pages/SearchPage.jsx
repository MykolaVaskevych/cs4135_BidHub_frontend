import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(() => searchParams.get('q') ? 1 : 0);

  const [seenUrlQ, setSeenUrlQ] = useState(() => searchParams.get('q') ?? '');
  const currentUrlQ = searchParams.get('q') ?? '';
  if (currentUrlQ !== seenUrlQ) {
    setSeenUrlQ(currentUrlQ);
    if (currentUrlQ) {
      setQuery(currentUrlQ);
      setReloadKey((k) => k + 1);
    }
  }

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
  }, [reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const inputCls = 'px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-500';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Search Listings</h2>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex gap-2 mb-2 flex-wrap">
        <input
          placeholder="Search listings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
          className={`${inputCls} flex-[2] min-w-[240px]`}
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`${inputCls} flex-1 min-w-[160px]`}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        <input
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          type="number"
          className={`${inputCls} flex-1 min-w-[120px]`}
        />
        <input
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          type="number"
          className={`${inputCls} flex-1 min-w-[120px]`}
        />
        <button
          onClick={doSearch}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
        >
          Search
        </button>
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-gray-500">No listings found.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Title</th>
                <th className="px-3 py-2 font-medium text-gray-700">Current Price</th>
                <th className="px-3 py-2 font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 font-medium text-gray-700">Ends</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.listingId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">{l.title}</td>
                  <td className="px-3 py-2">{l.currentPrice} {l.currency}</td>
                  <td className="px-3 py-2 text-gray-700">{l.status}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {l.endTime ? new Date(l.endTime).toLocaleString() : '-'}
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
