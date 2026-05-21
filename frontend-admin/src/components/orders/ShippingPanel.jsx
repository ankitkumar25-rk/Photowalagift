import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  RTO: 'RTO',
};

export default function ShippingPanel({ order, onRefresh }) {
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState(order.warehouseId || '');
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    setWarehouseId(order.warehouseId || '');
  }, [order.warehouseId]);

  const createShipmentMut = useMutation({
    mutationFn: () => api.post('/shipping/create', { orderId: order.id }),
    onSuccess: () => {
      toast.success('Shipment created');
      onRefresh?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Unable to create shipment'),
  });

  const assignCourierMut = useMutation({
    mutationFn: (rate) => api.post('/shipping/assign-courier', {
      orderId: order.id,
      lspId: rate.lspId,
      service: rate.service,
      shippingCharge: rate.rateSummary?.total,
    }),
    onSuccess: () => {
      toast.success('Courier assigned');
      onRefresh?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Unable to assign courier'),
  });

  const schedulePickupMut = useMutation({
    mutationFn: () => api.post('/shipping/schedule-pickup', { orderId: order.id, warehouseId }),
    onSuccess: () => {
      toast.success('Pickup scheduled');
      onRefresh?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Unable to schedule pickup'),
  });

  const packingSlipMut = useMutation({
    mutationFn: () => api.get(`/shipping/packing-slip/${order.id}`),
    onSuccess: (res) => {
      const url = res?.data?.packingSlip?.url || res?.data?.packingSlip?.fileUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.success('Packing slip ready');
      }
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Unable to get packing slip'),
  });

  const trackMut = useMutation({
    mutationFn: () => api.get(`/shipping/track/${order.id}`),
    onSuccess: (res) => {
      setTracking(res?.data?.tracking || null);
      onRefresh?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Unable to track shipment'),
  });

  const healthMut = useMutation({
    mutationFn: () => api.get('/shipping/health'),
    onSuccess: (res) => {
      const ok = res?.data?.success;
      if (ok) {
        toast.success('ShipingTech OK');
      } else {
        const errMsg = res?.data?.message || 'Check credentials';
        toast.error(`ShipingTech error: ${errMsg}`);
      }
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'ShipingTech check failed'),
  });

  const loadRates = async () => {
    setRatesLoading(true);
    try {
      const res = await api.get(`/shipping/rates/${order.id}`);
      setRates(res.data?.rates || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to load rates');
    } finally {
      setRatesLoading(false);
    }
  };

  const hasShipment = Boolean(order.shipingTechUUID);
  const statusLabel = STATUS_LABELS[order.shippingStatus] || order.shippingStatus || 'Not Created';

  return (
    <div className="card p-6 space-y-6 luxury-grain">
      <div className="flex items-center justify-between border-b border-[#5b3f2f]/5 pb-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f]">Shipping</h3>
        <button
          type="button"
          onClick={() => healthMut.mutate()}
          disabled={healthMut.isPending}
          className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#5b3f2f]/20 text-[#5b3f2f] hover:bg-[#f5e7d8] transition-all disabled:opacity-50"
        >
          {healthMut.isPending ? 'Checking...' : 'Ping ShipingTech'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-[#5b3f2f]">
        <span className="text-[#7a655c]/70">Status</span>
        <span className="truncate">{statusLabel}</span>
        <span className="text-[#7a655c]/70">Shipment UUID</span>
        <span className="truncate">{order.shipingTechUUID || '-'}</span>
        <span className="text-[#7a655c]/70">AWB</span>
        <span className="truncate">{order.awbNumber || '-'}</span>
        <span className="text-[#7a655c]/70">Courier</span>
        <span className="truncate">{order.courierName || '-'}</span>
        <span className="text-[#7a655c]/70">Service</span>
        <span className="truncate">{order.courierService || '-'}</span>
      </div>

      {!hasShipment && (
        <button
          type="button"
          onClick={() => createShipmentMut.mutate()}
          disabled={createShipmentMut.isPending}
          className="w-full py-2 rounded-xl bg-[#5b3f2f] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#b88a2f] transition-all disabled:opacity-50"
        >
          {createShipmentMut.isPending ? 'Creating...' : 'Create Shipment'}
        </button>
      )}

      {hasShipment && order.shippingStatus === 'PENDING' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={loadRates}
            disabled={ratesLoading}
            className="w-full py-2 rounded-xl border border-[#5b3f2f]/20 text-[10px] font-black uppercase tracking-[0.2em] text-[#5b3f2f] hover:bg-[#f5e7d8] transition-all disabled:opacity-50"
          >
            {ratesLoading ? 'Loading Rates...' : 'Get Rates'}
          </button>
          <div className="space-y-3">
            {rates.map((rate) => (
              <div key={`${rate.lspId}-${rate.service}`} className="border border-[#f5e7d8] rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#5b3f2f]">{rate.lspId}</p>
                  <p className="text-sm text-[#5b3f2f]/60">{rate.service}</p>
                  <p className="text-xs text-[#b88a2f]">{rate.tat ? `${rate.tat} days` : 'TAT N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#5b3f2f]">INR {rate.rateSummary?.total}</p>
                  <button
                    onClick={() => assignCourierMut.mutate(rate)}
                    disabled={assignCourierMut.isPending}
                    className="mt-2 bg-[#5b3f2f] text-white text-xs px-3 py-1.5 rounded-full hover:bg-[#3b1d16] disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
            {!ratesLoading && rates.length === 0 && (
              <p className="text-xs text-[#7a655c]/70">No rates loaded yet.</p>
            )}
          </div>
        </div>
      )}

      {hasShipment && order.shippingStatus === 'ASSIGNED' && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#7a655c]">Warehouse ID</label>
            <input
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="input-field py-2 text-xs mt-2"
              placeholder="Enter warehouse ID"
            />
          </div>
          <button
            type="button"
            onClick={() => schedulePickupMut.mutate()}
            disabled={schedulePickupMut.isPending || !warehouseId}
            className="w-full py-2 rounded-xl bg-[#b88a2f] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#5b3f2f] transition-all disabled:opacity-50"
          >
            {schedulePickupMut.isPending ? 'Scheduling...' : 'Schedule Pickup'}
          </button>
        </div>
      )}

      {hasShipment && order.shippingStatus === 'PICKUP_SCHEDULED' && (
        <div className="space-y-3">
          <p className="text-xs text-[#7a655c]/70">Pickup Date: {order.pickupDate ? new Date(order.pickupDate).toLocaleString('en-IN') : 'Scheduled'}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => packingSlipMut.mutate()}
              disabled={packingSlipMut.isPending}
              className="flex-1 py-2 rounded-xl border border-[#5b3f2f]/20 text-[10px] font-black uppercase tracking-[0.2em] text-[#5b3f2f] hover:bg-[#f5e7d8] transition-all disabled:opacity-50"
            >
              {packingSlipMut.isPending ? 'Loading...' : 'Packing Slip'}
            </button>
            <button
              type="button"
              onClick={() => trackMut.mutate()}
              disabled={trackMut.isPending}
              className="flex-1 py-2 rounded-xl bg-[#5b3f2f] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#b88a2f] transition-all disabled:opacity-50"
            >
              {trackMut.isPending ? 'Tracking...' : 'Track Shipment'}
            </button>
          </div>
        </div>
      )}

      {hasShipment && ['IN_TRANSIT', 'DELIVERED', 'RTO', 'PICKED_UP'].includes(order.shippingStatus || '') && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => trackMut.mutate()}
            disabled={trackMut.isPending}
            className="w-full py-2 rounded-xl bg-[#5b3f2f] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#b88a2f] transition-all disabled:opacity-50"
          >
            {trackMut.isPending ? 'Refreshing...' : 'Refresh Tracking'}
          </button>
          {tracking && (
            <pre className="text-[10px] text-[#5b3f2f] bg-[#fcf9f6] border border-[#5b3f2f]/10 rounded-xl p-3 whitespace-pre-wrap">
              {JSON.stringify(tracking, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
