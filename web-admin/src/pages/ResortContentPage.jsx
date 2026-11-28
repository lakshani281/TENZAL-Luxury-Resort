import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import aboutApi from '../api/aboutApi';
import { FileText, Save, Eye, CheckCircle, Clock } from 'lucide-react';

export default function ResortContentPage() {
  const { user } = useAuth();
  const toastContext = useToast();
  const addToast = toastContext?.addToast || toastContext?.showToast || (() => {});

  const [content, setContent] = useState({
    title: 'About TENZAL Luxury Boutique Resort',
    intro: 'A quiet boutique retreat in the hills of Haputale, Sri Lanka.',
    content:
      'Nestled amidst the emerald slopes of Haputale, TENZAL Luxury Boutique Resort is a tranquil sanctuary of serenity and elegance. Perched high above the clouds with panoramic vistas of the rolling Uva valley, we combine authentic Sri Lankan hospitality with refined contemporary luxury. Every suite is thoughtfully curated with local timber furnishings, deep-soaking bathtubs, private misty balconies, and warm personalized service.',
    status: 'published',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await aboutApi.getAboutContent();
        if (data) setContent(data);
      } catch (err) {
        addToast(err.message || 'Failed to load resort content.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await aboutApi.updateAboutContent(content);
      setContent(updated);
      addToast('Resort About Us content published successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save content.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <Header
        title="Resort Content"
        subtitle="Editorial copy, resort story, amenities and policies"
        searchPlaceholder="Search content..."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-8">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
            <div>
              <h3 className="font-serif text-xl font-bold text-gray-900">
                Resort Story & About Us Editor
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Managed by User Management & About Us Module (22CIS0274)
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                content.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/80'
              }`}
            >
              {content.status === 'published' ? '● Published' : '○ Draft'}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Headline / Title
              </label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                disabled={!isAdmin}
                required
                className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Introductory Summary
              </label>
              <textarea
                rows={2}
                value={content.intro}
                onChange={(e) => setContent({ ...content, intro: e.target.value })}
                disabled={!isAdmin}
                required
                className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Complete Story & Philosophy
              </label>
              <textarea
                rows={7}
                value={content.content}
                onChange={(e) => setContent({ ...content, content: e.target.value })}
                disabled={!isAdmin}
                required
                className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] disabled:bg-gray-50 disabled:text-gray-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Status:</label>
                <select
                  value={content.status}
                  onChange={(e) => setContent({ ...content, status: e.target.value })}
                  disabled={!isAdmin}
                  className="px-3 py-1.5 bg-white text-xs font-medium rounded-xl border border-gray-200"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save & Publish'}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Live Guest Preview Card */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#245d6a] mb-4">
              <Eye className="w-4 h-4" />
              <span>Live Guest View Preview</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
                alt="TENZAL Resort View"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <span className="text-[10px] tracking-widest uppercase text-white font-serif">
                  Haputale · Uva Highlands
                </span>
              </div>
            </div>

            <h4 className="font-serif text-xl font-bold text-gray-900 leading-snug">
              {content.title}
            </h4>
            <p className="text-xs text-[#245d6a] font-medium mt-1">
              {content.intro}
            </p>
            <p className="text-xs text-gray-600 mt-4 leading-relaxed line-clamp-6">
              {content.content}
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Location: Haputale, Sri Lanka</span>
            <span className="text-emerald-700 font-semibold">Ready for Guests</span>
          </div>
        </div>
      </div>
    </div>
  );
}
