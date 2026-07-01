import API from './api';

// All calls hit admin-only endpoints; the backend enforces the role on every request.
export const adminGetMe = () => API.get('/admin/me').then((r) => r.data);
export const adminGetConfig = () => API.get('/admin/config').then((r) => r.data);
export const adminUpdateConfig = (section: string, values: any) =>
  API.put(`/admin/config/${section}`, { values }).then((r) => r.data);
export const adminStats = () => API.get('/admin/stats').then((r) => r.data);

export const adminListUsers = (q?: string) =>
  API.get('/admin/users', { params: q ? { q } : {} }).then((r) => r.data);
export const adminBanUser = (uid: string) => API.post(`/admin/users/${uid}/ban`).then((r) => r.data);
export const adminUnbanUser = (uid: string) => API.post(`/admin/users/${uid}/unban`).then((r) => r.data);
export const adminDeleteUser = (uid: string) => API.delete(`/admin/users/${uid}`).then((r) => r.data);

export const adminListAdmins = () => API.get('/admin/admins').then((r) => r.data);
export const adminAddAdmin = (payload: { email?: string; uid?: string; role: string }) =>
  API.post('/admin/admins', payload).then((r) => r.data);
export const adminRemoveAdmin = (uid: string) => API.delete(`/admin/admins/${uid}`).then((r) => r.data);

export const adminAudit = () => API.get('/admin/audit').then((r) => r.data);
