import { useState, useEffect } from 'react';
import { api } from '../api/client';

const TOP_UP_AMOUNTS = [10, 50, 100, 500];

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/payments/wallet').catch(() => null),
      api.get('/payments/transactions').catch(() => []),
    ]).then(([w, txs]) => {
      if (cancelled) return;
      setWallet(w);
      setTransactions(txs ?? []);
    });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleTopUp = async (amount) => {
    setMsg(''); setError('');
    try {
      await api.post('/payments/wallet/top-up', { amount });
      setMsg(`€${amount} added to your wallet.`);
      reload();
    } catch (err) { setError(err.body?.message || err.message); }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Wallet</h2>
      {msg && <p role="status" className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-gray-50 border border-gray-200 px-6 py-5 mb-6">
        <div className="text-sm text-gray-500 mb-1">Available Balance</div>
        <div className="text-3xl font-bold text-gray-900">
          {wallet ? `€${wallet.balance}` : '-'}
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3">Top Up</h3>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TOP_UP_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => handleTopUp(amt)}
            className="px-5 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 hover:bg-gray-50"
          >
            + €{amt}
          </button>
        ))}
      </div>

      <h3 className="text-lg font-semibold mb-3">Transaction History</h3>
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions yet.</p>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Date</th>
                <th className="px-3 py-2 font-medium text-gray-700">Type</th>
                <th className="px-3 py-2 font-medium text-gray-700">Description</th>
                <th className="px-3 py-2 font-medium text-gray-700 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.transactionId} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-3 py-2">{tx.type}</td>
                  <td className="px-3 py-2 text-gray-600">{tx.description}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${tx.amount >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {tx.amount >= 0 ? `+€${tx.amount}` : `-€${Math.abs(tx.amount)}`}
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
