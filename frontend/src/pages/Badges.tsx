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

const ICON_GLYPH: Record<string, string> = {
  skill: '🛠️',
  star: '⭐',
  rocket: '🚀',
  doc: '📄',
  mic: '🎙️',
  code: '💻',
  map: '🗺️',
  flame: '🔥',
  trophy: '🏆',
};

function Medal({ badge }: { badge: Badge }) {
  const ring = TIER_RING[badge.tier] || '#94a3b8';
  return (
    <div
      className="relative shrink-0"
      style={{ filter: badge.earned ? 'none' : 'grayscale(1)', opacity: badge.earned ? 1 : 0.45 }}
    >
      <svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#ffffff" stroke={ring} strokeWidth="4" />
        <circle cx="32" cy="32" r="22" fill={ring} fillOpacity="0.14" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl">
        {ICON_GLYPH[badge.icon] || '🏅'}
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
