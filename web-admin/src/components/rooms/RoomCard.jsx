import React from 'react';
import { Pencil, CalendarDays, Users, Maximize2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

export default function RoomCard({ room, onEdit, onCheckAvailability }) {
  const amenitiesList = Array.isArray(room.amenities)
    ? room.amenities
    : room.amenities
      ? String(room.amenities).split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  const price = Number(room.price_per_night);
  const formattedPrice = Number.isFinite(price) ? price.toFixed(0) : 'N/A';

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group">
      <div className="relative h-56 w-full overflow-hidden bg-gray-100">
        <img
          src={room.image_url || FALLBACK_IMAGE}
          alt={room.name || 'Room image'}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        <div className="absolute top-3.5 right-3.5">
          <StatusBadge status={room.status} />
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold tracking-widest text-[#245d6a] uppercase">
              ROOM {room.room_number}
            </span>

            <div className="text-right">
              <span className="text-xl font-bold text-[#245d6a]">
                ${formattedPrice}
              </span>
              <span className="text-xs text-gray-500 font-normal">/night</span>
            </div>
          </div>

          <h4 className="font-serif text-xl font-bold text-gray-900 tracking-tight leading-snug">
            {room.name || 'Unnamed Room'}
          </h4>

          <p className="text-xs text-gray-500 mt-2 line-clamp-1">
            {amenitiesList.length > 0
              ? amenitiesList.join(' · ')
              : `${room.type || 'Standard Room'} with scenic views`}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
              {room.size_sqm ? `${room.size_sqm} m²` : 'Spacious interior'}
            </span>

            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              {room.capacity ? `Max ${room.capacity} guests` : 'Capacity unconfirmed'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onEdit?.(room)}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
            aria-label={`Edit ${room.name || 'room'}`}
          >
            <Pencil className="w-3.5 h-3.5 text-gray-500" />
            Edit Room
          </button>

          <button
            type="button"
            onClick={() => onCheckAvailability?.(room)}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[#245d6a] hover:text-[#18424b] text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
            aria-label={`Check availability for ${room.name || 'room'}`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#245d6a]" />
            Availability
          </button>
        </div>
      </div>
    </div>
  );
}