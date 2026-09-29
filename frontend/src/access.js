// Page-level access control. A user's `permissions` (array of page keys) overrides the role default;
// null/undefined means "use the role default". The master `admin` account always has full access.
export const PAGES = [
  { key: 'dashboard', label: 'Dashboard', group: 'main' },
  { key: 'checkout', label: 'Checkout', group: 'main' },
  { key: 'reservations', label: 'Pre-Orders', group: 'main' },
  { key: 'inventory', label: 'Inventory', group: 'main' },
  { key: 'general', label: 'General Items', group: 'main' },
  { key: 'suppliers', label: 'Suppliers', group: 'main' },
  { key: 'notifications', label: 'Notifications', group: 'main' },
  { key: 'stock', label: 'Stock Control', group: 'admin' },
  { key: 'history', label: 'Stock History', group: 'admin' },
  { key: 'sales_history', label: 'Checkout History', group: 'admin' },
  { key: 'returns', label: 'Returns & Refunds', group: 'admin' },
  { key: 'reports', label: 'Reports', group: 'admin' },
  { key: 'users', label: 'Staff Management', group: 'admin' },
];

export const ROLE_DEFAULTS = {
  Manager: PAGES.map(p => p.key),
  Cashier: ['checkout', 'reservations', 'inventory', 'general', 'suppliers', 'notifications'],
};

export const parsePermissions = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try { const v = JSON.parse(raw); return Array.isArray(v) ? v : null; } catch { return null; }
  }
  return null;
};

export const permissionsFor = (user) => {
  if (!user) return [];
  if (user.username === 'admin') return ROLE_DEFAULTS.Manager;
  return parsePermissions(user.permissions) || ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.Cashier;
};

export const canAccess = (user, key) => key === 'profile' || permissionsFor(user).includes(key);
