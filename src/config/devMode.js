// Temporary development/demo override.
// Remove this file and its imports when the public MVP no longer needs seeded demo access.
const DEMO_ADMIN_EMAILS = new Set([
  'byjuetheodore1234@gmail.com',
]);

export function isDevModeEnabled() {
  return import.meta.env.VITE_DEV_MODE === 'true';
}

export function isDemoAdminEmail(email) {
  return DEMO_ADMIN_EMAILS.has(String(email || '').trim().toLowerCase());
}

export function canUseDemoMode(user) {
  return isDevModeEnabled() && isDemoAdminEmail(user?.email);
}
