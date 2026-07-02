import { useConfig } from '../context/ConfigContext';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * PATH brand mark: a route/path line forming a "P" topped with a location pin.
 * If an admin has uploaded a custom logo (config.branding.logoUrl), that is shown instead.
 */
export default function Logo({ size = 32, withWordmark = false, className = '' }: LogoProps) {
  const { config } = useConfig();
  const logoUrl: string | undefined = config?.branding?.logoUrl;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={config?.site?.name || 'Logo'} style={{ height: size }} className="w-auto object-contain" />
      ) : (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PATH" role="img">
          <rect width="64" height="64" rx="15" fill="#166534" />
          <path
            d="M22 50 V26 a10 10 0 0 1 10 -10 h3 a9 9 0 0 1 0 18 h-7"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="43.5" cy="18.5" r="4.5" fill="#d97706" />
        </svg>
      )}
      {withWordmark && !logoUrl && (
        <span className="font-extrabold tracking-tight text-slate-800 text-lg leading-none">PATH</span>
      )}
    </span>
  );
}
