import React from 'react';
import { Star } from 'lucide-react';
import { RestroomPlace } from '../types';
import { getCategoryMeta } from '../lib/categories';

interface PlaceRowProps {
  place: RestroomPlace;
  subtitle: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
  lang?: 'th' | 'en';
}

/** Compact, scannable list row used by both Explore and Route panels */
export const PlaceRow: React.FC<PlaceRowProps> = ({ place, subtitle, selected, onClick, trailing, lang = 'th' }) => {
  const meta = getCategoryMeta(place.category);
  const tags: string[] = [];
  if (place.facilities.bidetSprayer) tags.push('สายฉีด');
  if (place.facilities.wheelchairAccessible) tags.push('วีลแชร์');
  if (place.opening_hours?.includes('24')) tags.push('24 ชม.');
  if (place.price_type === 'free') tags.push('ฟรี');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors cursor-pointer ${
        selected ? 'bg-emerald-50' : 'hover:bg-slate-50 active:bg-slate-100'
      }`}
    >
      <div
        className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl"
        style={{ backgroundColor: `${meta.color}14` }}
      >
        {meta.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[15px] text-slate-900 truncate">
            {lang === 'th' ? place.name : place.name_en || place.name}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-slate-500 mt-0.5 min-w-0">
          <span className="inline-flex items-center gap-0.5 text-slate-700 font-medium shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {place.overallRating.toFixed(1)}
          </span>
          <span className="text-slate-300">·</span>
          <span className="truncate">{subtitle}</span>
        </div>
        {tags.length > 0 && (
          <p className="text-[12px] text-slate-400 mt-1 truncate">{tags.join(' · ')}</p>
        )}
      </div>

      {trailing}
    </div>
  );
};
