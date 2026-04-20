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
    <div style={{ maxWidth: 600 }}>
      <h2>Wallet</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ background: '#f6f8fa', border: '1px solid #ddd', borderRadius: 8, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>Available Balance</div>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>
          {wallet ? `€${wallet.balance}` : '—'}
        </div>
      </div>

      <h3>Top Up</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TOP_UP_AMOUNTS.map((amt) => (
          <button key={amt} onClick={() => handleTopUp(amt)} style={{ padding: '10px 20px', fontSize: 15 }}>
            + €{amt}
          </button>
        ))}
      </div>

      <h3>Transaction History</h3>
      {transactions.length === 0 ? (
        <p style={{ color: '#888' }}>No transactions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Date</th>
              <th style={{ padding: '6px 8px' }}>Type</th>
              <th style={{ padding: '6px 8px' }}>Description</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.transactionId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 8px', fontSize: 12 }}>
                  {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '6px 8px', fontSize: 13 }}>{tx.type}</td>
                <td style={{ padding: '6px 8px', fontSize: 13, color: '#555' }}>{tx.description}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold',
                  color: tx.amount >= 0 ? '#1a7f37' : '#c00' }}>
                  {tx.amount >= 0 ? `+€${tx.amount}` : `-€${Math.abs(tx.amount)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
