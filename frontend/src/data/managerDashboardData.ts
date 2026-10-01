export type StatAccent = 'indigo' | 'blue' | 'purple' | 'cyan';

export interface DashboardStat {
  id: string;
  label: string;
  value: string | null;
  description: string;
  icon: string;
  accent: StatAccent;
}

export interface ManagerOccupancySummary {
  percentage: number | null;
  occupied: number | null;
  vacant: number | null;
}

export interface ManagerDashboardData {
  reportingPeriod: string | null;
  stats: readonly DashboardStat[];
  attentionItems: readonly unknown[];
  occupancy: ManagerOccupancySummary | null;
}

const unavailableDescription = 'No verified data available yet';

export const managerDashboardData: ManagerDashboardData = {
  reportingPeriod: null,
  stats: [
    { id: 'apartments', label: 'Total Apartments', value: null, description: unavailableDescription, icon: 'bi-buildings', accent: 'indigo' },
    { id: 'flats', label: 'Total Flats', value: null, description: unavailableDescription, icon: 'bi-grid-3x3-gap', accent: 'blue' },
    { id: 'occupied', label: 'Occupied Flats', value: null, description: unavailableDescription, icon: 'bi-house-check', accent: 'purple' },
    { id: 'vacant', label: 'Vacant Flats', value: null, description: unavailableDescription, icon: 'bi-house-door', accent: 'cyan' },
    { id: 'income', label: 'Monthly Rent Income', value: null, description: unavailableDescription, icon: 'bi-graph-up-arrow', accent: 'blue' },
    { id: 'pending', label: 'Pending Payments', value: null, description: unavailableDescription, icon: 'bi-hourglass-split', accent: 'indigo' },
    { id: 'complaints', label: 'Open Complaints', value: null, description: unavailableDescription, icon: 'bi-chat-left-text', accent: 'purple' },
    { id: 'maintenance', label: 'Maintenance Requests', value: null, description: unavailableDescription, icon: 'bi-tools', accent: 'cyan' },
  ],
  attentionItems: [],
  occupancy: null,
};
