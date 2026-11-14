
import React, { useState } from 'react';
import {
  Pencil,
  CalendarDays,
  Users,
  Maximize2,
  BedDouble,
  ArrowUpRight,
  ImageOff,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

const formatPrice = (value) => {
  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(price);
};

export default function RoomCard({
  room,
  onEdit,
  onCheckAvailability,
}) {
  const [imageError, setImageError] = useState(false);

  const amenitiesList = Array.isArray(room.amenities)
    ? room.amenities
    : room.amenities
      ? String(room.amenities).split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  const imageSrc = imageError
    ? FALLBACK_IMAGE
    : room.image_url || FALLBACK_IMAGE;

  return (
    <article className="group bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">

      {/* Room Image */}
      <div className="relative h-56 w-full overflow-hidden bg-gray-100">
        {!imageError ? (
          <img
            src={imageSrc}
            alt={room.name || 'Resort room'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">Image unavailable</span>
          </div>
        )}

        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 pointer-events-none" />

        {/* Room Status */}
        <div className="absolute top-4 right-4">
          <StatusBadge status={room.status} />
        </div>

        {/* Room Number */}
        <div className="absolute bottom-4 left-4">
          <span className="text-white text-xs font-bold tracking-widest uppercase drop-shadow-md">
            ROOM {room.room_number || 'N/A'}
          </span>
        </div>
      </div>

      {/* Room Information */}
      <div className="p-5 flex-1 flex flex-col">

        {/* Name and Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-xl font-bold text-gray-900 tracking-tight leading-snug group-hover:text-[#245d6a] transition-colors">
              {room.name || 'Unnamed Room'}
            </h3>

            <p className="text-xs text-gray-500 mt-1 capitalize">
              {room.type || 'Standard Room'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-[#245d6a]">
              ${formatPrice(room.price_per_night)}
            </p>
            <p className="text-[11px] text-gray-400">Per night</p>
          </div>
        </div>

        {/* Amenities */}
        <div className="mt-4 min-h-10">
          {amenitiesList.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {amenitiesList.slice(0, 3).map((amenity, index) => (
                <span
                  key={`${amenity}-${index}`}
                  className="px-2.5 py-1 bg-[#245d6a]/5 text-[#245d6a] rounded-lg text-[10px] font-medium"
                >
                  {amenity}
                </span>
              ))}

              {amenitiesList.length > 3 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-medium">
                  +{amenitiesList.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              No amenities added
            </p>
          )}
        </div>

        {/* Room Specifications */}
        <div className="grid grid-cols-2 gap-3 mt-5 py-4 border-y border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-[#245d6a]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Room Size
              </p>
              <p className="text-xs font-semibold text-gray-700">
                {room.size_sqm ? `${room.size_sqm} m²` : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#245d6a]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Capacity
              </p>
              <p className="text-xs font-semibold text-gray-700">
                {room.capacity ? `${room.capacity} Guests` : 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-auto pt-4">
          <button
            type="button"
            onClick={() => onEdit?.(room)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-gray-200 hover:border-[#245d6a] hover:bg-[#245d6a]/5 text-gray-700 hover:text-[#245d6a] text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245d6a]"
            aria-label={`Edit ${room.name || 'room'}`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Room
          </button>

          <button
            type="button"
            onClick={() => onCheckAvailability?.(room)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#245d6a] hover:bg-[#18424b] text-white text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245d6a] focus-visible:ring-offset-2"
            aria-label={`Check availability for ${room.name || 'room'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Availability
            <ArrowUpRight className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>
    </article>
  );
}
