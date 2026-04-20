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

function JobTable({ jobs, onAction, role }) {
  if (jobs.length === 0) return <p style={{ color: '#888' }}>None.</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
          <th>Job ID</th>
          <th>Status</th>
          <th>Next step</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.deliveryJobId} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{j.deliveryJobId?.slice(0, 8)}…</td>
            <td>{STATUS_LABEL[j.status] ?? j.status}</td>
            <td style={{ fontSize: 12, color: '#555', maxWidth: 220 }}>{nextStepHint(j.status, role) ?? '—'}</td>
            <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {role === 'DELIVERY_DRIVER' && j.status === 'IN_TRANSIT' && (
                <button onClick={() => onAction(j.deliveryJobId, 'deliver')}>Mark Delivered</button>
              )}
              {role === 'SELLER' && j.status === 'ASSIGNED' && (
                <button onClick={() => onAction(j.deliveryJobId, 'collect')}>Confirm Handover</button>
              )}
              {role === 'BUYER' && j.status === 'DELIVERED' && (
                <>
                  <button onClick={() => onAction(j.deliveryJobId, 'confirm')}>Confirm Receipt</button>
                  <button onClick={() => onAction(j.deliveryJobId, 'dispute')} style={{ color: '#c00' }}>Dispute</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
        const reason = window.prompt('Reason for dispute:');
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
      <h2>Deliveries</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {role === 'DELIVERY_DRIVER' && (
        <>
          <h3>Available Jobs</h3>
          {pendingJobs.length === 0 ? <p style={{ color: '#888' }}>No pending jobs available.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th>Job ID</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Escrow</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingJobs.map((j) => (
                  <tr key={j.deliveryJobId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{j.deliveryJobId?.slice(0, 8)}…</td>
                    <td>{j.pickupAddress?.city ?? '—'}</td>
                    <td>{j.deliveryAddress?.city ?? '—'}</td>
                    <td>—</td>
                    <td><button onClick={() => handleAssign(j.deliveryJobId)}>Assign to Me</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>My Jobs</h3>
          <JobTable jobs={myJobs} onAction={handleAction} role={role} />
        </>
      )}

      {role !== 'DELIVERY_DRIVER' && (
        <>
          <h3>My Deliveries</h3>
          <JobTable jobs={myJobs} onAction={handleAction} role={role} />
        </>
      )}
    </div>
  );
}
