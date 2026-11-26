import React from 'react';
import Header from '../components/layout/Header';

export default function PlaceholderPage({ title, subtitle }) {
  return (
    <div>
      <Header
        title={title}
        subtitle={subtitle}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
      />

      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs p-8 text-center">
        <h4 className="font-serif text-xl font-bold text-gray-800 mb-2">{title}</h4>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          {subtitle || 'This section is assigned to another team member as part of the TENZAL Luxury Resort group project.'}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
          <span>Student ID: 22CIS0276 Assigned Scope:</span>
          <span className="font-semibold text-[#245d6a]">Room Booking Module</span>
        </div>
      </div>
    </div>
  );
}
