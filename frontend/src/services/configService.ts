import API from './api';

/** Public runtime site config (content, theme, feature flags, nav, seo). No auth required. */
export async function getPublicConfig(): Promise<any> {
  const { data } = await API.get('/config');
  return data;
}
