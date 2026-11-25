import React from 'react';
import Modal from '../common/Modal';
import OrderStatusBadge from './OrderStatusBadge';
import { History, Clock, User } from 'lucide-react';

export default function OrderHistoryModal({ isOpen, order, onClose }) {
  if (!order) return null;

  const history = Array.isArray(order.status_history) ? order.status_history : [];

  const formatDateTime = (val) => {
    if (!val) return 'N/A';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(val);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Audit History"
      subtitle={`ORDER ${order.order_code}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
          <div>
            <span className="text-gray-400">Destination:</span>{' '}
            <span className="font-semibold text-gray-800">{order.room_name || order.room_number}</span>
          </div>
          <div>
            <span className="text-gray-400">Current Status:</span> <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No status history recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {history.map((entry, index) => (
              <div key={entry.history_id || index} className="relative group">
                {/* Timeline Node */}
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white bg-[#245d6a] shadow-xs" />

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {entry.previous_status && (
                        <>
                          <OrderStatusBadge status={entry.previous_status} />
                          <span className="text-gray-400 text-xs">&rarr;</span>
                        </>
                      )}
                      <OrderStatusBadge status={entry.new_status} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(entry.created_at)}</span>
                    </div>
                  </div>

                  {entry.change_reason && (
                    <p className="text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100">
                      <span className="font-semibold text-gray-500 block text-[10px] uppercase tracking-wider mb-0.5">
                        Reason / Note:
                      </span>
                      {entry.change_reason}
                    </p>
                  )}

                  {entry.changed_by_user_id && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>Action by user ID: {entry.changed_by_user_id}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </Modal>
  );
}
