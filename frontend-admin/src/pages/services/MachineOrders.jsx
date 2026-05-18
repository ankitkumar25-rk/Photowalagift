import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, Download, Eye, Trash2, 
  ChevronRight, MoreVertical, CheckCircle2, 
  Clock, XCircle, FileText, Settings, Cpu
} from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
  PROCESSING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SHIPPED: 'bg-purple-100 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'In Production',
  SHIPPED: 'Shipped',
  DELIVERED: 'Completed',
  CANCELLED: 'Cancelled'
};

export default function MachineOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['service-orders', 'MACHINE', statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/service-orders/admin/all', {
        params: { 
          category: 'MACHINE',
          status: statusFilter === 'ALL' ? undefined : statusFilter
        }
      });
      return data.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await api.patch(`/service-orders/admin/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-orders']);
      toast.success('Order status updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (!window.confirm('Are you sure you want to delete this order?')) return;
      await api.delete(`/service-orders/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-orders']);
      toast.success('Order deleted');
    }
  });

  const filteredOrders = orders?.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.serviceName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machine Services</h1>
          <p className="text-sm text-gray-500">Manage technical machine service requests (Laser, CNC, etc.)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer or Service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-gray-200 pl-10 text-sm focus:border-brand-primary focus:ring-brand-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border-gray-200 text-sm focus:border-brand-primary focus:ring-brand-primary/20"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fdfaf7] text-[10px] font-bold uppercase tracking-widest text-brand-primary/60 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Machine / Material</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="5" className="py-20 text-center text-gray-400">Loading orders...</td></tr>
              ) : filteredOrders?.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center text-gray-400">No orders found</td></tr>
              ) : (
                filteredOrders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-primary group-hover:underline">
                        <Link to={`/services/orders/${order.id}`}>{order.orderNumber}</Link>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.customerName || order.user?.name}</div>
                      <div className="text-xs text-gray-500">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                          <Settings className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{order.serviceName}</div>
                          <div className="text-xs text-gray-500">{order.productName || 'Custom'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.fileUrl && (
                          <button 
                            onClick={() => {
                              if (order.fileUrl === 'SEND_VIA_EMAIL') {
                                toast.info('Customer opted to send file via email.');
                                return;
                              }
                              const link = document.createElement('a');
                              link.href = order.fileUrl;
                              link.target = '_blank';
                              link.download = `tech-file-${order.orderNumber}`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              order.fileUrl === 'SEND_VIA_EMAIL' 
                                ? 'text-gray-400 hover:bg-gray-100' 
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                            title={order.fileUrl === 'SEND_VIA_EMAIL' ? 'Sent via Email' : 'Download Technical File'}
                          >
                            {order.fileUrl === 'SEND_VIA_EMAIL' ? <Mail className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                          </button>
                        )}
                        <Link 
                          to={`/services/orders/${order.id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => deleteMutation.mutate(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
