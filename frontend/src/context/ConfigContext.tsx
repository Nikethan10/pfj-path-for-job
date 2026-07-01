import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getPublicConfig } from '../services/configService';

interface ConfigValue {
  config: any;
  loading: boolean;
  refresh: () => Promise<void>;
  isFeatureEnabled: (key: string) => boolean;
}

const ConfigContext = createContext<ConfigValue | null>(null);

function applyTheme(theme: any) {
  if (!theme) return;
  const root = document.documentElement;
  if (theme.primary) root.style.setProperty('--pfj-primary', theme.primary);
  if (theme.accent) root.style.setProperty('--pfj-accent', theme.accent);
  if (theme.secondary) root.style.setProperty('--pfj-secondary', theme.secondary);
  if (theme.radius) root.style.setProperty('--pfj-radius', theme.radius);
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const cfg = await getPublicConfig();
      setConfig(cfg);
      applyTheme(cfg?.theme);
      if (cfg?.seo?.title) document.title = cfg.seo.title;
    } catch {
      // On failure the app falls back to its built-in defaults.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFeatureEnabled = useCallback(
    (key: string) => config?.features?.[key] !== false,
    [config],
  );

  return (
    <ConfigContext.Provider value={{ config, loading, refresh, isFeatureEnabled }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigValue {
  const ctx = useContext(ConfigContext);
  // Safe fallback so components work even outside the provider (features default ON).
  return ctx ?? { config: null, loading: false, refresh: async () => {}, isFeatureEnabled: () => true };
}
