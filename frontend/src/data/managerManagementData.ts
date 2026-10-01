export type ManagerSection = 'overview' | 'apartments' | 'flats' | 'tenants' | 'rent' | 'utilities' | 'complaints' | 'notices';

export interface ManagerNavigationItem { id: ManagerSection; label: string; shortLabel: string; description: string; icon: string; }
export interface Apartment { id: number; name: string; address: string; flats: number | null; occupied: number | null; vacant: number | null; contact: string | null; status: 'Active' | 'Maintenance'; image: string | null; }
export interface Flat { id: number; number: string; apartment: string; floor: string; tenant: string; rent: string | null; occupancy: 'Occupied' | 'Vacant' | 'Maintenance'; lease: 'Active' | 'Expiring' | 'Available'; }
export interface Tenant { id: number; name: string; flat: string; apartment: string; contact: string | null; lease: string | null; rentStatus: 'Paid' | 'Pending' | 'Overdue'; accountStatus: 'Active' | 'Notice'; }
export interface Payment { id: number; tenant: string; apartment: string; flat: string; month: string; amount: string | null; dueDate: string | null; paymentDate: string | null; status: 'Paid' | 'Pending' | 'Overdue'; }
export interface UtilityBill { id: number; tenant: string; flat: string; electricity: string | null; water: string | null; gas: string | null; month: string; total: string | null; dueDate: string | null; status: 'Paid' | 'Pending' | 'Overdue'; }
export interface ManagementComplaint { id: number; title: string; tenant: string; flat: string; category: string; priority: 'Low' | 'Medium' | 'High'; submitted: string | null; status: 'New' | 'In Progress' | 'Resolved' | 'Closed'; }
export interface ManagementNotice { id: number; title: string; category: string; audience: string; published: string | null; status: 'Published' | 'Draft' | 'Scheduled'; description: string; }

export const managerNavigation: readonly ManagerNavigationItem[] = [
  { id: 'overview', label: 'Dashboard', shortLabel: 'Overview', description: 'Portfolio data and management actions', icon: 'bi-grid-1x2' },
  { id: 'apartments', label: 'Apartment Management', shortLabel: 'Apartments', description: 'Manage buildings and property records', icon: 'bi-buildings' },
  { id: 'flats', label: 'Flat Management', shortLabel: 'Flats', description: 'Track units, occupancy, and leases', icon: 'bi-door-open' },
  { id: 'tenants', label: 'Tenant Management', shortLabel: 'Tenants', description: 'Manage residents and lease accounts', icon: 'bi-people' },
  { id: 'rent', label: 'Rent Collection', shortLabel: 'Rent Collection', description: 'Review and record monthly payments', icon: 'bi-wallet2' },
  { id: 'utilities', label: 'Utility Bill Management', shortLabel: 'Utilities', description: 'Monitor utility billing and balances', icon: 'bi-lightning-charge' },
  { id: 'complaints', label: 'Complaints', shortLabel: 'Complaints', description: 'Manage resident complaints and responses', icon: 'bi-tools' },
  { id: 'notices', label: 'Notice Management', shortLabel: 'Notices', description: 'Publish community communications', icon: 'bi-megaphone' },
];

// These collections remain empty until a manager dashboard API is implemented.
export const apartments: readonly Apartment[] = [];
export const flats: readonly Flat[] = [];
export const tenants: readonly Tenant[] = [];
export const payments: readonly Payment[] = [];
export const utilityBills: readonly UtilityBill[] = [];
export const managementComplaints: readonly ManagementComplaint[] = [];
export const notices: readonly ManagementNotice[] = [];
