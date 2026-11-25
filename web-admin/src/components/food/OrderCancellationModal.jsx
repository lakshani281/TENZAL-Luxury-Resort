import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import OrderStatusBadge from './OrderStatusBadge';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function OrderCancellationModal({
  isOpen,
  order,
  onClose,
  onConfirm,
  isSubmitting = false,
  apiError = null,
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setTouched(false);
    }
  }, [isOpen, order]);

  if (!order) return null;

  const trimmedReason = reason.trim();
  const isValidLength = trimmedReason.length >= 5;
  const showError = touched && !isValidLength;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValidLength || isSubmitting) return;
    onConfirm(trimmedReason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Cancel Order"
      subtitle="ORDER CANCELLATION"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning banner */}
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900">Permanent Action</p>
            <p className="mt-0.5 text-rose-700">
              Cancelling an order is a terminal state transition. A meaningful reason is required for resort audit logs.
            </p>
          </div>
        </div>

        {/* Order Details Brief */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Order Code:</span>
            <span className="font-mono font-bold text-gray-900">{order.order_code}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Destination:</span>
            <span className="font-medium text-gray-900">{order.room_name || order.room_number}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Current Status:</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Order Total:</span>
            <span className="font-bold text-[#245d6a]">
              LKR {Number(order.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Backend Error Alert if present */}
        {apiError && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-medium">
            {apiError}
          </div>
        )}

        {/* Cancellation Reason Textarea */}
        <div className="space-y-1.5">
          <label htmlFor="cancel-reason" className="block text-xs font-semibold text-gray-700">
            Cancellation Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (!touched) setTouched(true);
            }}
            maxLength={255}
            disabled={isSubmitting}
            placeholder="Please explain why this order is being cancelled (min. 5 characters)..."
            className={`w-full p-3 bg-white text-sm text-gray-900 rounded-xl border transition-all focus:outline-hidden focus:ring-2 ${
              showError
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-gray-200 focus:border-[#275965] focus:ring-[#275965]/20'
            }`}
          />
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>
              {showError && (
                <span className="text-rose-600 font-medium">
                  A meaningful reason of at least 5 characters is required.
                </span>
              )}
            </span>
            <span>{reason.length} / 255</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            type="submit"
            disabled={!isValidLength || isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirm Cancellation
          </button>
        </div>
      </form>
    </Modal>
  );
}
