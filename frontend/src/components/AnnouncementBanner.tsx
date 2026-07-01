import { useConfig } from '../context/ConfigContext';

const STYLES: Record<string, string> = {
  info: 'bg-[var(--pfj-primary)] text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-slate-900',
};

/** Site-wide banner controlled from the admin portal (Content → Announcement). */
export default function AnnouncementBanner() {
  const { config } = useConfig();
  const ann = config?.announcement;
  if (!ann?.enabled || !ann?.text) return null;
  return (
    <div className={`w-full text-center text-sm font-medium py-2 px-4 ${STYLES[ann.type] || STYLES.info}`}>
      {ann.text}
    </div>
  );
}
