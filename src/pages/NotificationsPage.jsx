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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get(`/notifications/me?page=${page}&size=20`)
      .then((data) => {
        if (cancelled) return;
        let items = [];
        if (Array.isArray(data?.content)) items = data.content;
        else if (Array.isArray(data)) items = data;
        setNotifications(items);
        setTotalPages(data?.totalPages ?? 1);
      })
      .catch((err) => { if (!cancelled) setError(err.body?.message || err.message); });
    return () => { cancelled = true; };
  }, [page]);

  const btnPager = 'px-3 py-1 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      {notifications.length === 0 && !error ? (
        <p className="text-sm text-gray-500">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div key={n.notificationId} className="border border-gray-200 bg-white px-4 py-3">
              <div className="flex justify-between items-baseline mb-1 gap-2">
                <strong className="text-sm font-semibold text-gray-900">{TYPE_LABEL[n.type] ?? n.type}</strong>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                </span>
              </div>
              <div className="text-sm text-gray-700">{n.subject || n.message || n.type}</div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 items-center">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={btnPager}>Prev</button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className={btnPager}>Next</button>
        </div>
      )}
    </div>
  );
}
