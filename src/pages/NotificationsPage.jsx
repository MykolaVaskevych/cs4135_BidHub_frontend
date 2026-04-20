import { useState, useEffect } from 'react';
import { api } from '../api/client';

const TYPE_LABEL = {
  BID_OUTBID: 'Outbid',
  AUCTION_WON: 'Auction Won',
  AUCTION_ENDED_SELLER: 'Auction Ended',
  PAYMENT_RECEIPT: 'Payment',
  ESCROW_RELEASED: 'Escrow Released',
  ORDER_CREATED: 'Order Created',
  ORDER_COMPLETED: 'Order Completed',
  ORDER_CANCELLED: 'Order Cancelled',
  DRIVER_ASSIGNED: 'Driver Assigned',
  GOODS_DELIVERED: 'Delivered',
  DISPUTE_RAISED: 'Dispute',
  USER_SUSPENDED: 'Account Suspended',
  WELCOME: 'Welcome',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/notifications/me')
      .then((data) => {
        if (cancelled) return;
        const items = data?.content ?? data ?? [];
        setNotifications(items);
      })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ maxWidth: 640 }}>
      <h2>Notifications</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {notifications.length === 0 && !error ? (
        <p style={{ color: '#888' }}>No notifications yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n) => (
            <div key={n.notificationId} style={{
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: 6,
              background: '#fafafa',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ fontSize: 13 }}>{TYPE_LABEL[n.type] ?? n.type}</strong>
                <span style={{ fontSize: 12, color: '#888' }}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                </span>
              </div>
              <div style={{ fontSize: 14, color: '#333' }}>{n.message || JSON.stringify(n.vars ?? {})}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
