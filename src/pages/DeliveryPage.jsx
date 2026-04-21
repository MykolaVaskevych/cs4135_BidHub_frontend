import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';

const STATUS_LABEL = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  COLLECTING: 'Collecting',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CONFIRMED: 'Confirmed',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
};

const NEXT_STEP = {
  PENDING:    'Waiting for a driver to pick up this job.',
  ASSIGNED:   { SELLER: 'Driver assigned — confirm you handed over the item.', DELIVERY_DRIVER: 'Waiting for seller to confirm handover.', BUYER: 'Driver assigned, awaiting collection.' },
  IN_TRANSIT: { DELIVERY_DRIVER: 'Item collected — mark as delivered once dropped off.', SELLER: 'Item in transit.', BUYER: 'Item on its way to you.' },
  DELIVERED:  { BUYER: 'Driver says it\'s delivered — confirm receipt or raise a dispute.', SELLER: 'Delivered, awaiting buyer confirmation.', DELIVERY_DRIVER: 'Awaiting buyer confirmation.' },
  CONFIRMED:  'Delivery complete. Escrow released.',
  DISPUTED:   'Dispute in progress.',
  CANCELLED:  'Job cancelled.',
};

function nextStepHint(status, role) {
  const entry = NEXT_STEP[status];
  if (!entry) return null;
  return typeof entry === 'string' ? entry : (entry[role] ?? null);
}

function deliveryStatusClass(status) {
  switch (status) {
    case 'CONFIRMED': return 'text-green-700';
    case 'IN_TRANSIT':
    case 'COLLECTING': return 'text-blue-700';
    case 'DELIVERED': return 'text-amber-700';
    case 'DISPUTED': return 'text-red-600';
    case 'CANCELLED': return 'text-gray-500';
    default: return 'text-gray-700';
  }
}

const btnBase = 'px-2.5 py-1 text-xs font-medium border';
const btnPrimary = `${btnBase} text-white bg-gray-900 border-gray-900 hover:bg-gray-800`;
const btnDanger = `${btnBase} text-red-700 bg-white border-red-300 hover:bg-red-50`;

function JobTable({ jobs, onAction, role }) {
  if (jobs.length === 0) return <p className="text-sm text-gray-500 mb-4">None.</p>;
  return (
    <div className="border border-gray-200 overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-left">
            <th className="px-3 py-2 font-medium text-gray-700">Job ID</th>
            <th className="px-3 py-2 font-medium text-gray-700">Status</th>
            <th className="px-3 py-2 font-medium text-gray-700">Next step</th>
            <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.deliveryJobId} className="border-b border-gray-100">
              <td className="px-3 py-2 font-mono text-xs">{j.deliveryJobId?.slice(0, 8)}…</td>
              <td className={`px-3 py-2 font-medium ${deliveryStatusClass(j.status)}`}>
                {STATUS_LABEL[j.status] ?? j.status}
              </td>
              <td className="px-3 py-2 text-xs text-gray-600 max-w-xs">{nextStepHint(j.status, role) ?? '-'}</td>
              <td className="px-3 py-2">
                <div className="flex gap-1.5 flex-wrap">
                  {role === 'DELIVERY_DRIVER' && j.status === 'IN_TRANSIT' && (
                    <button onClick={() => onAction(j.deliveryJobId, 'deliver')} className={btnPrimary}>Mark Delivered</button>
                  )}
                  {role === 'SELLER' && j.status === 'ASSIGNED' && (
                    <button onClick={() => onAction(j.deliveryJobId, 'collect')} className={btnPrimary}>Confirm Handover</button>
                  )}
                  {role === 'BUYER' && j.status === 'DELIVERED' && (
                    <>
                      <button onClick={() => onAction(j.deliveryJobId, 'confirm')} className={btnPrimary}>Confirm Receipt</button>
                      <button onClick={() => onAction(j.deliveryJobId, 'dispute')} className={btnDanger}>Dispute</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DeliveryPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [myJobs, setMyJobs] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    api.get('/delivery/me')
      .then((data) => { if (!cancelled) setMyJobs(data ?? []); })
      .catch(() => {});

    if (role === 'DELIVERY_DRIVER') {
      api.get('/delivery/pending')
        .then((data) => { if (!cancelled) setPendingJobs(data ?? []); })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [reloadKey, role]);

  const handleAction = useCallback(async (jobId, action) => {
    setMsg(''); setError('');
    try {
      if (action === 'deliver') {
        await api.post(`/delivery/${jobId}/deliver`);
      } else if (action === 'collect') {
        await api.post(`/delivery/${jobId}/collect`);
      } else if (action === 'confirm') {
        await api.post(`/delivery/${jobId}/confirm`);
      } else if (action === 'dispute') {
        const reason = globalThis.prompt('Reason for dispute:');
        if (!reason) return;
        await api.post(`/delivery/${jobId}/dispute`, { reason });
      }
      setMsg('Done');
      reload();
    } catch (err) { setError(err.body?.message || err.message); }
  }, []);

  const handleAssign = async (jobId) => {
    setMsg(''); setError('');
    try {
      await api.post(`/delivery/${jobId}/assign`, { driverId: user.userId });
      setMsg('Job assigned to you');
      reload();
    } catch (err) { setError(err.body?.message || err.message); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Deliveries</h2>
      {msg && <p role="status" className="text-sm text-green-700 mb-3">{msg}</p>}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      {role === 'DELIVERY_DRIVER' && (
        <>
          <h3 className="text-lg font-semibold mb-3">Available Jobs</h3>
          {pendingJobs.length === 0 ? (
            <p className="text-sm text-gray-500 mb-6">No pending jobs available.</p>
          ) : (
            <div className="border border-gray-200 overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-3 py-2 font-medium text-gray-700">Job ID</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Pickup</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Delivery</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Escrow</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingJobs.map((j) => (
                    <tr key={j.deliveryJobId} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-mono text-xs">{j.deliveryJobId?.slice(0, 8)}…</td>
                      <td className="px-3 py-2">{j.pickupAddress?.city ?? '-'}</td>
                      <td className="px-3 py-2">{j.deliveryAddress?.city ?? '-'}</td>
                      <td className="px-3 py-2 text-gray-500">-</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleAssign(j.deliveryJobId)} className={btnPrimary}>Assign to Me</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="text-lg font-semibold mb-3">My Jobs</h3>
          <JobTable jobs={myJobs} onAction={handleAction} role={role} />
        </>
      )}

      {role !== 'DELIVERY_DRIVER' && (
        <>
          <h3 className="text-lg font-semibold mb-3">My Deliveries</h3>
          <JobTable jobs={myJobs} onAction={handleAction} role={role} />
        </>
      )}
    </div>
  );
}
