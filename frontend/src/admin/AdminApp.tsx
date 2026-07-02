import { useEffect, useState } from 'react';
import { toast } from '../lib/toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import Loader from '../components/Loader';
import Logo from '../components/Logo';
import * as admin from '../services/adminService';

type SectionKey = 'overview' | 'content' | 'branding' | 'theme' | 'features' | 'nav' | 'users' | 'admins' | 'audit';

const SECTIONS: { key: SectionKey; label: string; superOnly?: boolean }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'content', label: 'Content' },
  { key: 'branding', label: 'Branding' },
  { key: 'theme', label: 'Theme' },
  { key: 'features', label: 'Features' },
  { key: 'nav', label: 'Navigation' },
  { key: 'users', label: 'Users' },
  { key: 'admins', label: 'Admins', superOnly: true },
  { key: 'audit', label: 'Audit log' },
];

function Denied({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900 text-slate-800 px-6 text-center">
      <Logo size={44} />
      <h1 className="mt-6 text-2xl font-bold">Restricted area</h1>
      <p className="mt-2 text-slate-500 max-w-sm">
        {loggedIn
          ? "You don't have access to this area."
          : 'Please sign in with an authorized account to continue.'}
      </p>
      <div className="mt-6 flex gap-3">
        <Link to={loggedIn ? '/dashboard' : '/login'} className="btn-primary">
          {loggedIn ? 'Back to app' : 'Sign in'}
        </Link>
      </div>
    </div>
  );
}

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <button onClick={onSave} disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      {saved && <span className="text-sm font-medium text-neon-cyan">✓ Saved</span>}
    </div>
  );
}

function useSaver() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const run = async (fn: () => Promise<any>) => {
    setSaving(true);
    setSaved(false);
    try {
      await fn();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };
  return { saving, saved, run };
}

const field = 'input-field';
const label = 'block text-sm font-semibold text-slate-700 mb-1';

/** Resize + compress an image in the browser to a small data URL (free-tier friendly — no cloud storage). */
async function fileToResizedDataUrl(file: File, maxDim: number, quality = 0.82): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  if (file.type === 'image/svg+xml') return dataUrl; // vector — already tiny
  const img = document.createElement('img');
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
  const isPng = file.type === 'image/png';
  return canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
}

function Branding({ cfg, refresh }: { cfg: any; refresh: () => void }) {
  const [branding, setBranding] = useState<any>(cfg.branding || {});
  const [busy, setBusy] = useState('');
  const saver = useSaver();

  const pick = async (key: string, maxDim: number, file?: File) => {
    if (!file) return;
    setBusy(key);
    try {
      const url = await fileToResizedDataUrl(file, maxDim);
      if (url.length > 900000) {
        toast.error('That image is still too large after compression. Please use a smaller one.');
        return;
      }
      setBranding((b: any) => ({ ...b, [key]: url }));
    } catch {
      toast.error('Could not process that image.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="glass-card max-w-lg space-y-6">
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Logo</h3>
        <p className="text-sm text-slate-500 mb-3">Shown top-left across the app. PNG or SVG recommended.</p>
        {branding.logoUrl
          ? <img src={branding.logoUrl} alt="logo" className="h-12 mb-2 rounded bg-white border border-dark-700 p-1" />
          : <p className="text-xs text-slate-400 mb-2">Using the built-in PATH mark.</p>}
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => pick('logoUrl', 256, e.target.files?.[0])} />
          {branding.logoUrl && <button className="text-rose-600 text-sm" onClick={() => setBranding((b: any) => ({ ...b, logoUrl: '' }))}>Remove</button>}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-slate-800 mb-1">Homepage hero image</h3>
        <p className="text-sm text-slate-500 mb-3">Optional large image for the landing page.</p>
        {branding.heroImageUrl
          ? <img src={branding.heroImageUrl} alt="hero" className="h-28 mb-2 rounded border border-dark-700 object-cover" />
          : <p className="text-xs text-slate-400 mb-2">No hero image set.</p>}
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => pick('heroImageUrl', 1280, e.target.files?.[0])} />
          {branding.heroImageUrl && <button className="text-rose-600 text-sm" onClick={() => setBranding((b: any) => ({ ...b, heroImageUrl: '' }))}>Remove</button>}
        </div>
      </div>

      {busy && <p className="text-sm text-slate-500">Processing image…</p>}
      <SaveBar {...saver} onSave={() => saver.run(async () => { await admin.adminUpdateConfig('branding', branding); refresh(); })} />
      <p className="text-xs text-slate-400">Images are compressed in your browser and saved into the site config — no paid storage needed.</p>
    </div>
  );
}

/* ─── Overview ─── */
function Overview() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    admin.adminStats().then(setStats).catch(() => {});
  }, []);
  const cards = [
    { k: 'total_users', label: 'Total users' },
    { k: 'banned_users', label: 'Banned users' },
    { k: 'total_admins', label: 'Admins' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.k} className="glass-card">
          <p className="text-3xl font-extrabold text-slate-800">{stats ? stats[c.k] ?? 0 : '—'}</p>
          <p className="text-sm text-slate-500 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Content ─── */
function Content({ cfg, refresh }: { cfg: any; refresh: () => void }) {
  const [site, setSite] = useState(cfg.site || {});
  const [hero, setHero] = useState(cfg.content?.hero || {});
  const [footer, setFooter] = useState(cfg.content?.footer || {});
  const [seo, setSeo] = useState(cfg.seo || {});
  const [ann, setAnn] = useState<any>(cfg.announcement || {});
  const s1 = useSaver();
  const s2 = useSaver();
  const s3 = useSaver();
  const s4 = useSaver();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card">
        <h3 className="font-bold text-slate-800 mb-3">Site</h3>
        <label className={label}>Site name</label>
        <input className={field} value={site.name || ''} onChange={(e) => setSite({ ...site, name: e.target.value })} />
        <label className={`${label} mt-3`}>Contact email</label>
        <input className={field} value={site.contactEmail || ''} onChange={(e) => setSite({ ...site, contactEmail: e.target.value })} />
        <label className={`${label} mt-3`}>Copyright</label>
        <input className={field} value={site.copyright || ''} onChange={(e) => setSite({ ...site, copyright: e.target.value })} />
        <SaveBar {...s1} onSave={() => s1.run(async () => { await admin.adminUpdateConfig('site', site); refresh(); })} />
      </div>

      <div className="glass-card">
        <h3 className="font-bold text-slate-800 mb-3">Homepage hero</h3>
        <label className={label}>Title</label>
        <input className={field} value={hero.title || ''} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
        <label className={`${label} mt-3`}>Subtitle</label>
        <textarea className={field} rows={3} value={hero.subtitle || ''} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className={label}>Primary button</label>
            <input className={field} value={hero.primaryCta || ''} onChange={(e) => setHero({ ...hero, primaryCta: e.target.value })} />
          </div>
          <div>
            <label className={label}>Secondary button</label>
            <input className={field} value={hero.secondaryCta || ''} onChange={(e) => setHero({ ...hero, secondaryCta: e.target.value })} />
          </div>
        </div>
        <label className={`${label} mt-3`}>Footer tagline</label>
        <input className={field} value={footer.tagline || ''} onChange={(e) => setFooter({ ...footer, tagline: e.target.value })} />
        <SaveBar {...s2} onSave={() => s2.run(async () => { await admin.adminUpdateConfig('content', { hero, footer }); refresh(); })} />
      </div>

      <div className="glass-card">
        <h3 className="font-bold text-slate-800 mb-3">SEO</h3>
        <label className={label}>Page title</label>
        <input className={field} value={seo.title || ''} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
        <label className={`${label} mt-3`}>Meta description</label>
        <textarea className={field} rows={2} value={seo.description || ''} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
        <SaveBar {...s3} onSave={() => s3.run(async () => { await admin.adminUpdateConfig('seo', seo); refresh(); })} />
      </div>

      <div className="glass-card">
        <h3 className="font-bold text-slate-800 mb-3">Announcement banner</h3>
        <label className="flex items-center gap-2 mb-3 text-slate-700 font-medium">
          <input type="checkbox" checked={!!ann.enabled} onChange={(e) => setAnn({ ...ann, enabled: e.target.checked })} />
          Show a site-wide banner
        </label>
        <input className={field} placeholder="Banner message" value={ann.text || ''} onChange={(e) => setAnn({ ...ann, text: e.target.value })} />
        <select className={`${field} mt-3`} value={ann.type || 'info'} onChange={(e) => setAnn({ ...ann, type: e.target.value })}>
          <option value="info">Info (brand)</option>
          <option value="success">Success (green)</option>
          <option value="warning">Warning (amber)</option>
        </select>
        <SaveBar {...s4} onSave={() => s4.run(async () => { await admin.adminUpdateConfig('announcement', ann); refresh(); })} />
      </div>
    </div>
  );
}

/* ─── Theme ─── */
function Theme({ cfg, refresh }: { cfg: any; refresh: () => void }) {
  const [theme, setTheme] = useState(cfg.theme || {});
  const saver = useSaver();
  const colors = [
    ['primary', 'Primary'],
    ['accent', 'Accent'],
    ['secondary', 'Secondary'],
  ];
  return (
    <div className="glass-card max-w-lg">
      <h3 className="font-bold text-slate-800 mb-3">Theme</h3>
      <div className="space-y-3">
        {colors.map(([k, lbl]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{lbl}</span>
            <div className="flex items-center gap-2">
              <input type="color" value={theme[k] || '#000000'} onChange={(e) => setTheme({ ...theme, [k]: e.target.value })} className="w-10 h-8 rounded border border-dark-700" />
              <input className={`${field} w-28`} value={theme[k] || ''} onChange={(e) => setTheme({ ...theme, [k]: e.target.value })} />
            </div>
          </div>
        ))}
        <div>
          <label className={label}>Corner radius (e.g. 0.75rem)</label>
          <input className={field} value={theme.radius || ''} onChange={(e) => setTheme({ ...theme, radius: e.target.value })} />
        </div>
      </div>
      <SaveBar {...saver} onSave={() => saver.run(async () => { await admin.adminUpdateConfig('theme', theme); refresh(); })} />
      <p className="text-xs text-slate-400 mt-3">Primary color applies to buttons and accents across the app.</p>
    </div>
  );
}

/* ─── Features ─── */
function Features({ cfg, refresh }: { cfg: any; refresh: () => void }) {
  const [features, setFeatures] = useState<any>(cfg.features || {});
  const saver = useSaver();
  return (
    <div className="glass-card max-w-lg">
      <h3 className="font-bold text-slate-800 mb-3">Feature flags</h3>
      <p className="text-sm text-slate-500 mb-4">Disabled features are hidden from every student instantly.</p>
      <div className="space-y-2">
        {Object.keys(features).map((k) => (
          <label key={k} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
            <span className="capitalize text-slate-700 font-medium">{k}</span>
            <input type="checkbox" checked={features[k] !== false} onChange={(e) => setFeatures({ ...features, [k]: e.target.checked })} className="w-5 h-5 accent-[var(--PATH-primary)]" />
          </label>
        ))}
      </div>
      <SaveBar {...saver} onSave={() => saver.run(async () => { await admin.adminUpdateConfig('features', features); refresh(); })} />
    </div>
  );
}

/* ─── Navigation ─── */
function Navigation({ cfg, refresh }: { cfg: any; refresh: () => void }) {
  const [nav, setNav] = useState<any[]>(cfg.nav || []);
  const saver = useSaver();
  const update = (i: number, patch: any) => setNav(nav.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= nav.length) return;
    const next = [...nav];
    [next[i], next[j]] = [next[j], next[i]];
    setNav(next.map((n, idx) => ({ ...n, order: idx })));
  };
  return (
    <div className="glass-card max-w-2xl">
      <h3 className="font-bold text-slate-800 mb-3">Navigation</h3>
      <div className="space-y-2">
        {nav.map((n, i) => (
          <div key={n.key} className="flex items-center gap-2 py-1.5 border-b border-dark-700 last:border-0">
            <input className={`${field} flex-1`} value={n.label} onChange={(e) => update(i, { label: e.target.value })} />
            <span className="text-xs text-slate-400 w-24 truncate">{n.path}</span>
            <label className="flex items-center gap-1 text-xs text-slate-600">
              <input type="checkbox" checked={n.enabled !== false} onChange={(e) => update(i, { enabled: e.target.checked })} /> show
            </label>
            <button onClick={() => move(i, -1)} className="px-2 text-slate-500 hover:text-slate-800">↑</button>
            <button onClick={() => move(i, 1)} className="px-2 text-slate-500 hover:text-slate-800">↓</button>
          </div>
        ))}
      </div>
      <SaveBar {...saver} onSave={() => saver.run(async () => { await admin.adminUpdateConfig('nav', nav); refresh(); })} />
    </div>
  );
}

/* ─── Users ─── */
function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    admin.adminListUsers(q).then(setUsers).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const act = async (fn: () => Promise<any>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try { await fn(); load(); } catch (e: any) { toast.error(e?.response?.data?.detail || 'Action failed'); }
  };
  return (
    <div className="glass-card">
      <div className="flex gap-2 mb-4">
        <input className={field} placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button className="btn-secondary" onClick={load}>Search</button>
      </div>
      {loading ? <p className="text-slate-500">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b border-dark-700">
              <th className="py-2">Name</th><th>Email</th><th>Status</th><th className="text-right">Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className="border-b border-dark-700 last:border-0">
                  <td className="py-2 font-medium text-slate-800">{u.name || '—'}</td>
                  <td className="text-slate-600">{u.email || '—'}</td>
                  <td>{u.banned ? <span className="badge badge-purple">Banned</span> : <span className="badge badge-cyan">Active</span>}</td>
                  <td className="text-right space-x-2 whitespace-nowrap">
                    {u.banned
                      ? <button className="text-neon-cyan font-medium" onClick={() => act(() => admin.adminUnbanUser(u.uid))}>Unban</button>
                      : <button className="text-amber-600 font-medium" onClick={() => act(() => admin.adminBanUser(u.uid))}>Ban</button>}
                    <button className="text-rose-600 font-medium" onClick={() => act(() => admin.adminDeleteUser(u.uid), `Delete ${u.email}? This cannot be undone.`)}>Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-400">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Admins (super only) ─── */
function Admins() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const load = () => admin.adminListAdmins().then(setAdmins).catch(() => {});
  useEffect(() => { load(); }, []);
  const add = async () => {
    try { await admin.adminAddAdmin({ email, role }); setEmail(''); load(); }
    catch (e: any) { toast.error(e?.response?.data?.detail || 'Could not add admin'); }
  };
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card">
        <h3 className="font-bold text-slate-800 mb-3">Add admin</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className={field} placeholder="user@email.com (must have signed in once)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className={`${field} sm:w-40`} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button className="btn-primary" onClick={add}>Add</button>
        </div>
      </div>
      <div className="glass-card">
        <h3 className="font-bold text-slate-800 mb-3">Current admins</h3>
        <div className="space-y-2">
          {admins.map((a, i) => (
            <div key={a.uid || a.email || i} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
              <div>
                <span className="font-medium text-slate-800">{a.email || a.uid}</span>
                <span className="ml-2 badge badge-cyan capitalize">{(a.role || 'admin').replace('_', ' ')}</span>
                {a.source === 'env' && <span className="ml-2 text-xs text-slate-400">(from server config)</span>}
              </div>
              {a.source !== 'env' && a.uid && (
                <button className="text-rose-600 font-medium text-sm" onClick={async () => { await admin.adminRemoveAdmin(a.uid); load(); }}>Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Audit ─── */
function Audit() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { admin.adminAudit().then(setLogs).catch(() => {}); }, []);
  return (
    <div className="glass-card">
      <h3 className="font-bold text-slate-800 mb-3">Recent activity</h3>
      <div className="space-y-1 text-sm">
        {logs.map((l) => (
          <div key={l.id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
            <span className="text-slate-700"><span className="font-semibold">{l.actor_email || l.actor_uid}</span> — {l.action}</span>
            <span className="text-xs text-slate-400">{(l.timestamp || '').replace('T', ' ').slice(0, 19)}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="text-slate-400">No activity yet.</p>}
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { user, loading: authLoading, logoutUser } = useAuth();
  const { config, refresh } = useConfig();
  const [me, setMe] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'denied' | 'ready'>('loading');
  const [section, setSection] = useState<SectionKey>('overview');
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setState('denied'); return; }
    admin.adminGetMe()
      .then((m) => {
        setMe(m);
        setState('ready');
        return admin.adminGetConfig().then(setCfg);
      })
      .catch(() => setState('denied'));
  }, [user, authLoading]);

  if (authLoading || state === 'loading') return <Loader />;
  if (state === 'denied') return <Denied loggedIn={!!user} />;

  const visibleSections = SECTIONS.filter((s) => !s.superOnly || me?.role === 'super_admin');
  const reloadCfg = () => { admin.adminGetConfig().then(setCfg); refresh(); };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-800 flex flex-col md:flex-row">
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r border-dark-700 bg-dark-800 p-4">
        <div className="flex items-center gap-2 mb-6"><Logo size={30} withWordmark /><span className="badge badge-purple">Admin</span></div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {visibleSections.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${section === s.key ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <div className="mt-6 pt-4 border-t border-dark-700 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">{me?.email}</p>
          <p className="capitalize">{(me?.role || '').replace('_', ' ')}</p>
          <Link to="/dashboard" className="block mt-3 hover:text-neon-cyan">← Back to app</Link>
          <button onClick={logoutUser} className="mt-1 hover:text-rose-600">Sign out</button>
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-6 capitalize">{SECTIONS.find((s) => s.key === section)?.label}</h1>
        {!cfg && section !== 'overview' && section !== 'users' && section !== 'admins' && section !== 'audit' ? (
          <Loader />
        ) : (
          <>
            {section === 'overview' && <Overview />}
            {section === 'content' && cfg && <Content cfg={cfg} refresh={reloadCfg} />}
            {section === 'branding' && cfg && <Branding cfg={cfg} refresh={reloadCfg} />}
            {section === 'theme' && cfg && <Theme cfg={cfg} refresh={reloadCfg} />}
            {section === 'features' && cfg && <Features cfg={cfg} refresh={reloadCfg} />}
            {section === 'nav' && cfg && <Navigation cfg={cfg} refresh={reloadCfg} />}
            {section === 'users' && <Users />}
            {section === 'admins' && <Admins />}
            {section === 'audit' && <Audit />}
          </>
        )}
      </main>
    </div>
  );
}
