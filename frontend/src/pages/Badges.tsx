import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getBadges } from '../services/badgeService';
import type { Badge, BadgesResponse } from '../types';
import Loader from '../components/Loader';

const TIER_RING: Record<string, string> = {
  bronze: '#d97706',
  silver: '#94a3b8',
  gold: '#eab308',
};

// Monochrome line-icon paths (drawn with currentColor) — no emoji.
const ICON_PATH: Record<string, string> = {
  skill: 'M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8 7.2 20l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.1-2.1 2.6-2.5z', // wrench
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5z',
  rocket: 'M5 15c-1 2-1 5-1 5s3 0 5-1m-4-4a12 12 0 0 1 9-9c3 0 4 1 4 4a12 12 0 0 1-9 9l-4-4zm5-1a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  doc: 'M7 3h7l5 5v13H7V3zm7 0v5h5', // document
  mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4', // microphone
  code: 'M9 8l-5 4 5 4M15 8l5 4-5 4', // code brackets
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14', // map
  flame: 'M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2.5-5 0 1.5 1 2.5 2 2.5-.5-3 .5-5 .5-6.5z', // flame
  trophy: 'M7 4h10v4a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M10 15h4M8 20h8M12 15v5', // trophy
};

function Medal({ badge }: { badge: Badge }) {
  const ring = TIER_RING[badge.tier] || '#94a3b8';
  const path = ICON_PATH[badge.icon] || 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.2l5.9-.9L12 3z';
  return (
    <div
      className="relative shrink-0"
      style={{ opacity: badge.earned ? 1 : 0.4 }}
    >
      <svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#ffffff" stroke={ring} strokeWidth="4" />
        <circle cx="32" cy="32" r="22" fill={ring} fillOpacity="0.14" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color: ring }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={path} />
        </svg>
      </span>
    </div>
  );
}

const TIER_BADGE: Record<string, string> = {
  bronze: 'badge-purple',
  silver: 'badge-cyan',
  gold: 'badge-pink',
};

export default function Badges() {
  const [data, setData] = useState<BadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBadges()
      .then(setData)
      .catch(() => setError('Could not load achievements. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="p-8 text-rose-600">{error}</div>;
  if (!data) return null;

  const pct = data.total_count ? Math.round((data.earned_count / data.total_count) * 100) : 0;
  const categories = Array.from(new Set(data.badges.map((b) => b.category)));

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">Achievements</h1>
        <p className="text-slate-500 mt-1">
          You've earned <span className="font-bold text-neon-cyan">{data.earned_count}</span> of{' '}
          {data.total_count} badges. Keep building your profile to unlock more.
        </p>
        <div className="mt-4 h-2 w-full rounded-full bg-dark-700 overflow-hidden">
          <div className="h-full bg-neon-cyan rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </header>

      {categories.map((cat) => (
        <section key={cat} className="mb-10">
          <h2 className="text-lg font-bold text-slate-700 mb-4">{cat}</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {data.badges
              .filter((b) => b.category === cat)
              .map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card flex items-center gap-4"
                >
                  <Medal badge={b} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{b.name}</h3>
                      <span className={`${TIER_BADGE[b.tier]} capitalize`}>{b.tier}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{b.description}</p>
                    {b.earned ? (
                      <p className="text-xs font-semibold text-neon-cyan mt-2">✓ Unlocked</p>
                    ) : (
                      <div className="mt-2">
                        <div className="h-1.5 w-full rounded-full bg-dark-700 overflow-hidden">
                          <div className="h-full bg-neon-cyan/70 rounded-full" style={{ width: `${b.progress}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {b.current}/{b.target}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
