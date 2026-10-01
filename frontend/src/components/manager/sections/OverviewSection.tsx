import { useEffect, useState } from 'react';
import SectionHeader from '../../dashboard/SectionHeader';
import StatCard from '../../dashboard/StatCard';
import type {
  DashboardStat,
  ManagerOccupancySummary,
} from '../../../data/managerDashboardData';
import type { ManagerSection } from '../../../data/managerManagementData';
import { apiRequest } from '../../../services/api';

interface OverviewSectionProps {
  firstName: string;
  onNavigate: (section: ManagerSection) => void;
  onComingSoon: (message: string) => void;
}

interface DashboardResponse {
  success: boolean;
  data: {
    total_apartments: number;
    total_flats: number;
    occupied_flats: number;
    vacant_flats: number;
    occupancy_percentage: number;
    expected_monthly_rent: number;
    pending_payments: number;
    overdue_payments: number;
    open_complaints: number;
    active_maintenance_requests: number;
    items_requiring_attention: {
      type: string;
      message: string;
      count: number;
    }[];
  };
}

const quickActions: readonly {
  label: string;
  icon: string;
  section: ManagerSection;
}[] = [
  { label: 'Add apartment', icon: 'bi-building-add', section: 'apartments' },
  { label: 'Add flat', icon: 'bi-door-open', section: 'flats' },
  { label: 'Add tenant', icon: 'bi-person-plus', section: 'tenants' },
  { label: 'Record payment', icon: 'bi-receipt', section: 'rent' },
  { label: 'Publish notice', icon: 'bi-megaphone', section: 'notices' },
  { label: 'Review complaints', icon: 'bi-chat-square-text', section: 'complaints' },
];

function OverviewSection({
  firstName,
  onNavigate,
  onComingSoon,
}: OverviewSectionProps) {
  const [dashboard, setDashboard] = useState<DashboardResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');

      const response = await apiRequest<DashboardResponse>(
        '/manager/dashboard'
      );

      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to load manager dashboard:', err);
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  const stats: DashboardStat[] = dashboard
    ? [
        {
          id: 'apartments',
          label: 'Total Apartments',
          value: String(dashboard.total_apartments),
          description: 'Apartments in your portfolio',
          icon: 'bi-buildings',
          accent: 'indigo',
        },
        {
          id: 'flats',
          label: 'Total Flats',
          value: String(dashboard.total_flats),
          description: 'Total flats across apartments',
          icon: 'bi-grid-3x3-gap',
          accent: 'blue',
        },
        {
          id: 'occupied',
          label: 'Occupied Flats',
          value: String(dashboard.occupied_flats),
          description: 'Currently occupied flats',
          icon: 'bi-house-check',
          accent: 'purple',
        },
        {
          id: 'vacant',
          label: 'Vacant Flats',
          value: String(dashboard.vacant_flats),
          description: 'Currently available flats',
          icon: 'bi-house-door',
          accent: 'cyan',
        },
        {
          id: 'income',
          label: 'Expected Monthly Rent',
          value: `৳${Number(dashboard.expected_monthly_rent).toLocaleString()}`,
          description: 'Expected monthly rent',
          icon: 'bi-graph-up-arrow',
          accent: 'blue',
        },
        {
          id: 'pending',
          label: 'Pending Payments',
          value: String(dashboard.pending_payments),
          description: `${dashboard.overdue_payments} overdue payment(s)`,
          icon: 'bi-hourglass-split',
          accent: 'indigo',
        },
        {
          id: 'complaints',
          label: 'Open Complaints',
          value: String(dashboard.open_complaints),
          description: 'Open or in-progress complaints',
          icon: 'bi-chat-left-text',
          accent: 'purple',
        },
        {
          id: 'maintenance',
          label: 'Maintenance Requests',
          value: String(dashboard.active_maintenance_requests),
          description: 'Pending or active requests',
          icon: 'bi-tools',
          accent: 'cyan',
        },
      ]
    : [];

  const occupancy: ManagerOccupancySummary | null = dashboard
    ? {
        percentage: dashboard.occupancy_percentage,
        occupied: dashboard.occupied_flats,
        vacant: dashboard.vacant_flats,
      }
    : null;

  const attentionItems = dashboard?.items_requiring_attention ?? [];

  return (
    <div className="manager-section manager-section--overview">
      <section className="manager-welcome">
        <div className="manager-welcome__content">
          <h1>
            Welcome, <span>{firstName}.</span>
          </h1>

          <p>
            {loading
              ? 'Loading your portfolio data...'
              : error
                ? error
                : 'Here is the current status of your property portfolio.'}
          </p>

          <div className="manager-welcome__actions">
            <button
              type="button"
              onClick={() => onNavigate('complaints')}
            >
              Review priorities
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>

          </div>

          <div
            className="manager-welcome__month"
            aria-label="Current reporting period"
          >
            <i className="bi bi-calendar3" aria-hidden="true" />

            <span>
              <small>Reporting period</small>
              <strong>
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="dashboard-summary-title">
        <h2
          id="dashboard-summary-title"
          className="visually-hidden"
        >
          Property summary
        </h2>

        {loading ? (
          <div className="manager-inline-empty">
            <span>
              <i className="bi bi-hourglass-split" aria-hidden="true" />
            </span>

            <div>
              <strong>Loading dashboard...</strong>
              <p>Fetching the latest portfolio information.</p>
            </div>
          </div>
        ) : (
          <div className="manager-stats-grid">
            {stats.map((stat) => (
              <StatCard
                key={stat.id}
                stat={stat}
              />
            ))}
          </div>
        )}
      </section>

      <div className="manager-overview-grid">
        <section className="manager-panel">
          <SectionHeader
            title="Requires attention"
            description="Items needing your review"
            icon="bi-exclamation-diamond"
          />

          {attentionItems.length > 0 ? (
            <div>
              {attentionItems.map((item, index) => (
                <div
                  key={`${item.type}-${index}`}
                  className="manager-inline-empty"
                >
                  <span>
                    <i
                      className="bi bi-exclamation-circle"
                      aria-hidden="true"
                    />
                  </span>

                  <div>
                    <strong>{item.message}</strong>
                    <p>
                      {item.count} item(s) require attention.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="manager-inline-empty">
              <span>
                <i
                  className="bi bi-inbox"
                  aria-hidden="true"
                />
              </span>

              <div>
                <strong>Nothing to review</strong>
                <p>
                  There are currently no outstanding attention items.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="manager-panel manager-insight">
          <SectionHeader
            title="Occupancy insight"
            description="Current portfolio occupancy"
            icon="bi-pie-chart"
          />

          <div
            className={`manager-occupancy ${
              occupancy ? '' : 'manager-occupancy--empty'
            }`}
          >
            <div
              className="manager-occupancy__ring"
              style={
                occupancy
                  ? {
                      background: `conic-gradient(#6366f1 0 ${occupancy.percentage}%, rgba(255,255,255,.08) ${occupancy.percentage}% 100%)`,
                    }
                  : undefined
              }
            >
              <span>
                <strong>
                  {occupancy
                    ? `${occupancy.percentage}%`
                    : '—'}
                </strong>

                <small>occupancy</small>
              </span>
            </div>

            <div>
              <div>
                <span>Occupied</span>
                <strong>
                  {occupancy
                    ? occupancy.occupied
                    : '—'}
                </strong>
              </div>

              <div>
                <span>Vacant</span>
                <strong>
                  {occupancy
                    ? occupancy.vacant
                    : '—'}
                </strong>
              </div>

              <p>
                {occupancy
                  ? 'Calculated from live database records.'
                  : 'No occupancy data yet.'}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="manager-panel">
        <SectionHeader
          title="Quick actions"
          description="Jump directly to a management task"
          icon="bi-lightning-charge"
        />

        <div className="manager-quick-grid">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                onNavigate(action.section);

                onComingSoon(
                  `${action.label} tools are available in ${action.section}.`
                );
              }}
            >
              <span>
                <i className={`bi ${action.icon}`} />
              </span>

              <strong>{action.label}</strong>

              <i className="bi bi-arrow-up-right" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default OverviewSection;
