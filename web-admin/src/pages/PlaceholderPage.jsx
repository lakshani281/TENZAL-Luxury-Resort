import React from 'react';
import Header from '../components/layout/Header';
import { Layers } from 'lucide-react';

export default function PlaceholderPage({ title = 'Module', subtitle = '' }) {
  return (
    <div className="space-y-6">
      <Header title={title} subtitle={subtitle} />

      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-14 h-14 rounded-2xl bg-[#245d6a]/10 text-[#245d6a] flex items-center justify-center mb-4">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-2 max-w-md">{subtitle}</p>
        )}
        <span className="mt-5 inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
          Module Workspace Ready
        </span>
      </div>
    </div>
  );
}
