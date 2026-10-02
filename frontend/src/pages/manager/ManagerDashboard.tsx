import { useCallback, useEffect, useState } from 'react';

import ManagerSidebar from '../../components/manager/ManagerSidebar';
import ManagerTopbar from '../../components/manager/ManagerTopbar';
import OverviewSection from '../../components/manager/sections/OverviewSection';

import {
  ComplaintsSection,
  TenantsSection,
  UtilitiesSection,
} from '../../components/manager/sections/ManagementSections';

import {
  ApartmentsSection,
  FlatsSection,
  NoticesSection,
  RentSection,
} from '../../components/manager/sections/PropertyRecordSections';

import {
  managerNavigation,
  type ManagerSection,
} from '../../data/managerManagementData';

import { useAuth } from '../../context/AuthContext';
import { getAuthenticatedUserIdentity } from '../../utils/authDisplay';

import {
  getManagerApartments,
  createManagerApartment,
  updateManagerApartment,
  deleteManagerApartment,

  getManagerFlats,
  createManagerFlat,
  updateManagerFlat,
  deleteManagerFlat,

  getManagerRentPayments,

  getManagerNotices,
  createManagerNotice,
  updateManagerNotice,
  deleteManagerNotice,

  getManagerTenants,
  getManagerEligibleTenants,
  onboardManagerTenant,
  getManagerUtilityBills,
  getManagerComplaints,
  updateManagerComplaint,
} from '../../services/managerApi';

import type {
  Apartment,
  ApartmentFormValues,
  Complaint,
  ComplaintResponseValues,
  Flat,
  FlatFormValues,
  Notice,
  NoticeFormValues,
  RecordId,
  RentPayment,
  TenantFormValues,
  UtilityBillFormValues,
} from '../../types/managerRecords';

import type {
  EligibleTenantUser,
  TenantOnboardingValues,
} from '../../services/managerApi';

import '../../styles/manager-dashboard.css';

function ManagerDashboard() {
  const { user } = useAuth();

  const [activeSection, setActiveSection] =
    useState<ManagerSection>('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  /*
  |--------------------------------------------------------------------------
  | REAL MANAGER DATA
  |--------------------------------------------------------------------------
  */

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const [tenants, setTenants] = useState<any[]>([]);
  const [utilityBills, setUtilityBills] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  /*
  |--------------------------------------------------------------------------
  | TENANT ONBOARDING
  |--------------------------------------------------------------------------
  */

  const [eligibleTenantUsers, setEligibleTenantUsers] =
    useState<EligibleTenantUser[]>([]);

  const [eligibleTenantsLoading, setEligibleTenantsLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOADING / ERROR STATE
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [apiError, setApiError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | CURRENT SECTION
  |--------------------------------------------------------------------------
  */

  const currentSection =
    managerNavigation.find(
      (item) => item.id === activeSection
    ) ?? managerNavigation[0];

  const identity =
    getAuthenticatedUserIdentity(user);

  /*
  |--------------------------------------------------------------------------
  | MESSAGE HELPERS
  |--------------------------------------------------------------------------
  */

  const clearMessages = () => {
    setApiError(null);
    setSuccessMessage(null);
  };

  const getErrorMessage = (error: unknown): string => {
    const err = error as {
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };

    if (err?.data?.message) {
      return err.data.message;
    }

    if (err?.data?.errors) {
      const firstError = Object.values(
        err.data.errors
      )
        .flat()
        .find(Boolean);

      if (firstError) {
        return firstError;
      }
    }

    return 'Something went wrong. Please try again.';
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD EVERYTHING FROM LARAVEL
  |--------------------------------------------------------------------------
  */

  const loadManagerRecords = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setApiError(null);

      const [
        apartmentsResponse,
        flatsResponse,
        rentResponse,
        noticesResponse,
        tenantsResponse,
        utilityBillsResponse,
        complaintsResponse,
      ] = await Promise.all([
        getManagerApartments(),
        getManagerFlats(),
        getManagerRentPayments(),
        getManagerNotices(),
        getManagerTenants(),
        getManagerUtilityBills(),
        getManagerComplaints(),
      ]);

      setApartments(
        apartmentsResponse.data ?? []
      );

      setFlats(
        flatsResponse.data ?? []
      );

      setRentPayments(
        rentResponse.data ?? []
      );

      setNotices(
        noticesResponse.data ?? []
      );

      setTenants(
        tenantsResponse.data ?? []
      );

      setUtilityBills(
        utilityBillsResponse.data ?? []
      );

      setComplaints(
        complaintsResponse.data ?? []
      );

    } catch (error) {
      console.error(
        'Failed to load manager records:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  /*
  |--------------------------------------------------------------------------
  | LOAD ELIGIBLE TENANT USERS
  |--------------------------------------------------------------------------
  */

  const loadEligibleTenantUsers = useCallback(async () => {
    try {
      setEligibleTenantsLoading(true);

      const response =
        await getManagerEligibleTenants();

      setEligibleTenantUsers(
        response.data ?? []
      );

    } catch (error) {
      console.error(
        'Failed to load eligible tenant users:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

    } finally {
      setEligibleTenantsLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | TENANT ONBOARDING
  |--------------------------------------------------------------------------
  */

  const handleCreateTenant = async (
    values: TenantFormValues
  ) => {
    const onboardingValues: TenantOnboardingValues = {
      user_id: values.user_id,
      flat_id:
        values.flat_id === '' ||
        values.flat_id === undefined
          ? null
          : values.flat_id,
      move_in_date:
        values.move_in_date || null,
      lease_start:
        values.lease_start || null,
      lease_end:
        values.lease_end || null,
    };

    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await onboardManagerTenant(
          onboardingValues
        );

      if (response.data) {
        setTenants((current) => [
          response.data,
          ...current,
        ]);
      }

      /*
      | Reload the tenant list from Laravel so the
      | newly onboarded user appears exactly as the
      | backend returns it.
      */
      const tenantsResponse =
        await getManagerTenants();

      setTenants(
        tenantsResponse.data ?? []
      );

      /*
      | Refresh eligible users so the onboarded
      | account disappears from the Add Tenant list.
      */
      await loadEligibleTenantUsers();

      setSuccessMessage(
        response.message ??
          'Tenant onboarded successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to onboard tenant:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TENANT UPDATE
  |--------------------------------------------------------------------------
  */

  const handleUpdateTenant = async (
    id: RecordId,
    values: TenantFormValues
  ) => {
    /*
    | Tenant editing is not part of the new onboarding
    | workflow yet. Keep this callback available for the
    | existing TenantSection API without changing the
    | current backend behavior.
    */
    console.warn(
      'Tenant update requested:',
      id,
      values
    );
  };

  /*
  |--------------------------------------------------------------------------
  | TENANT DELETE
  |--------------------------------------------------------------------------
  */

  const handleDeleteTenant = async (
    id: RecordId
  ) => {
    /*
    | Tenant deletion is intentionally left unchanged
    | until the tenant-management UI exposes that action.
    */
    console.warn(
      'Tenant delete requested:',
      id
    );
  };

  /*
  |--------------------------------------------------------------------------
  | COMPLAINT UPDATE
  |--------------------------------------------------------------------------
  */

  const handleUpdateComplaint = async (
    id: RecordId,
    values: ComplaintResponseValues
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await updateManagerComplaint(
          id,
          values
        );

      setComplaints((current) =>
        current.map((complaint) =>
          String(complaint.id) === String(id)
            ? response.data
            : complaint
        )
      );

      setSuccessMessage(
        'Complaint response saved successfully.'
      );

    } catch (error) {
      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadManagerRecords();
  }, [loadManagerRecords]);

  /*
  |--------------------------------------------------------------------------
  | PAGE TITLE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    document.title =
      `${currentSection.shortLabel} | Rentora Manager`;
  }, [currentSection.shortLabel]);

  /*
  |--------------------------------------------------------------------------
  | ESCAPE MOBILE MENU
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const closeOnEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener(
      'keydown',
      closeOnEscape
    );

    return () => {
      window.removeEventListener(
        'keydown',
        closeOnEscape
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const selectSection = (
    section: ManagerSection
  ) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    setAnnouncement('');
    clearMessages();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /*
  |--------------------------------------------------------------------------
  | APARTMENT CRUD
  |--------------------------------------------------------------------------
  */

  const handleCreateApartment = async (
    values: ApartmentFormValues
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await createManagerApartment(values);

      if (response.data) {
        setApartments((current) => [
          response.data,
          ...current,
        ]);
      }

      setSuccessMessage(
        'Apartment created successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to create apartment:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateApartment = async (
    id: RecordId,
    values: ApartmentFormValues
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await updateManagerApartment(
          id,
          values
        );

      if (response.data) {
        setApartments((current) =>
          current.map((apartment) =>
            String(apartment.id) === String(id)
              ? response.data
              : apartment
          )
        );
      }

      setSuccessMessage(
        'Apartment updated successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to update apartment:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApartment = async (
    id: RecordId
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      await deleteManagerApartment(id);

      setApartments((current) =>
        current.filter(
          (apartment) =>
            String(apartment.id) !== String(id)
        )
      );

      setSuccessMessage(
        'Apartment deleted successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to delete apartment:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FLAT CRUD
  |--------------------------------------------------------------------------
  */

  const handleCreateFlat = async (
    values: FlatFormValues
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await createManagerFlat(values);

      if (response.data) {
        setFlats((current) => [
          response.data,
          ...current,
        ]);
      }

      setSuccessMessage(
        'Flat created successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to create flat:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFlat = async (
    id: RecordId,
    values: FlatFormValues
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await updateManagerFlat(
          id,
          values
        );

      if (response.data) {
        setFlats((current) =>
          current.map((flat) =>
            String(flat.id) === String(id)
              ? response.data
              : flat
          )
        );
      }

      setSuccessMessage(
        'Flat updated successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to update flat:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFlat = async (
    id: RecordId
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      await deleteManagerFlat(id);

      setFlats((current) =>
        current.filter(
          (flat) =>
            String(flat.id) !== String(id)
        )
      );

      setSuccessMessage(
        'Flat deleted successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to delete flat:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | NOTICE CRUD
  |--------------------------------------------------------------------------
  */

  const handleCreateNotice = async (
    values: NoticeFormValues
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await createManagerNotice(values);

      if (response.data) {
        setNotices((current) => [
          response.data,
          ...current,
        ]);
      }

      setSuccessMessage(
        'Notice created successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to create notice:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNotice = async (
    id: RecordId,
    values: NoticeFormValues
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await updateManagerNotice(
          id,
          values
        );

      if (response.data) {
        setNotices((current) =>
          current.map((notice) =>
            String(notice.id) === String(id)
              ? response.data
              : notice
          )
        );
      }

      setSuccessMessage(
        'Notice updated successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to update notice:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (
    id: RecordId
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      await deleteManagerNotice(id);

      setNotices((current) =>
        current.filter(
          (notice) =>
            String(notice.id) !== String(id)
        )
      );

      setSuccessMessage(
        'Notice deleted successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to delete notice:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UTILITY BILL CREATE
  |--------------------------------------------------------------------------
  */

  const handleCreateUtilityBill = async (
    values: UtilityBillFormValues
  ) => {
    try {
      setSubmitting(true);
      clearMessages();

      const response = await fetch(
        "/api/manager/utility-bills",
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
          },
          body: JSON.stringify(values),
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw {
          status: response.status,
          data,
        };
      }

      if (data.data) {
        setUtilityBills((current) => [
          data.data,
          ...current,
        ]);
      }

      setSuccessMessage(
        'Utility bill created successfully.'
      );

    } catch (error) {
      console.error(
        'Failed to create utility bill:',
        error
      );

      setApiError(
        getErrorMessage(error)
      );

      throw error;

    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER ACTIVE SECTION
  |--------------------------------------------------------------------------
  */

  const renderActiveSection = () => {
    switch (activeSection) {

      case 'overview':
        return (
          <OverviewSection
            firstName={identity.firstName}
            onNavigate={selectSection}
            onComingSoon={setAnnouncement}
          />
        );

      case 'apartments':
        return (
          <ApartmentsSection
            apartments={apartments}
            onCreate={handleCreateApartment}
            onUpdate={handleUpdateApartment}
            onDelete={handleDeleteApartment}
            submitting={submitting}
            apiError={apiError}
            successMessage={successMessage}
          />
        );

      case 'flats':
        return (
          <FlatsSection
            flats={flats}
            apartments={apartments}
            onCreate={handleCreateFlat}
            onUpdate={handleUpdateFlat}
            onDelete={handleDeleteFlat}
            submitting={submitting}
            apiError={apiError}
            successMessage={successMessage}
          />
        );

      case 'tenants':
        return (
          <TenantsSection
            tenants={tenants}
            eligibleTenantUsers={eligibleTenantUsers}
            eligibleTenantsLoading={
              eligibleTenantsLoading
            }
            onLoadEligibleTenants={
              loadEligibleTenantUsers
            }
            onCreate={
              handleCreateTenant
            }
            onUpdate={
              handleUpdateTenant
            }
            onDelete={
              handleDeleteTenant
            }
            submitting={submitting}
          />
        );

      case 'rent':
        return (
          <RentSection
            payments={rentPayments}
          />
        );

      case 'utilities':
        return (
          <UtilitiesSection
            utilityBills={utilityBills}
            tenants={tenants}
            onCreate={handleCreateUtilityBill}
            submitting={submitting}
            apiError={apiError}
            successMessage={successMessage}
          />
        );

      case 'complaints':
        return (
          <ComplaintsSection
            complaints={complaints}
            onUpdateComplaint={
              handleUpdateComplaint
            }
            submitting={submitting}
            apiError={apiError}
            successMessage={successMessage}
          />
        );

      case 'notices':
        return (
          <NoticesSection
            notices={notices}
            onCreate={handleCreateNotice}
            onUpdate={handleUpdateNotice}
            onDelete={handleDeleteNotice}
            submitting={submitting}
            apiError={apiError}
            successMessage={successMessage}
          />
        );

      default:
        return null;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="manager-app-shell">

      <ManagerSidebar
        activeSection={activeSection}
        isOpen={mobileMenuOpen}
        onSelect={selectSection}
        onClose={() =>
          setMobileMenuOpen(false)
        }
      />

      <div className="manager-app-main">

        <ManagerTopbar
          identity={identity}
          section={currentSection}
          onMenuOpen={() =>
            setMobileMenuOpen(true)
          }
        />

        <main className="manager-app-content">

          <p
            className="visually-hidden"
            role="status"
            aria-live="polite"
          >
            {announcement ||
              `${currentSection.label} selected`}
          </p>

          {loading && (
            <div
              className="manager-loading"
              role="status"
            >
              Loading manager data...
            </div>
          )}

          {apiError && !loading && (
            <div
              className="manager-api-error"
              role="alert"
            >
              {apiError}
            </div>
          )}

          <div
            key={activeSection}
            className="manager-section-transition"
          >
            {renderActiveSection()}
          </div>

        </main>

      </div>

    </div>
  );
}

export default ManagerDashboard;