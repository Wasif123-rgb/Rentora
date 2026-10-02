import { apiRequest } from './api';

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
  ListResponse,
} from '../types/managerRecords';

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

export interface ManagerDashboardResponse {
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
    featured_property: {
      id: number;
      name: string;
      address: string;
      flat_count: number;
    } | null;
    items_requiring_attention: {
      type: string;
      message: string;
      count: number;
    }[];
  };
}

export async function getManagerDashboard() {
  return apiRequest<ManagerDashboardResponse>(
    '/manager/dashboard'
  );
}

/*
|--------------------------------------------------------------------------
| Apartments
|--------------------------------------------------------------------------
*/

export async function getManagerApartments() {
  return apiRequest<ListResponse<Apartment>>(
    '/manager/apartments'
  );
}

export async function createManagerApartment(
  values: ApartmentFormValues
) {
  return apiRequest<{
    success: boolean;
    message?: string;
    data: Apartment;
  }>('/manager/apartments', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export async function updateManagerApartment(
  id: RecordId,
  values: ApartmentFormValues
) {
  return apiRequest<{
    success: boolean;
    message?: string;
    data: Apartment;
  }>(`/manager/apartments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(values),
  });
}

export async function deleteManagerApartment(
  id: RecordId
) {
  return apiRequest<{
    success: boolean;
    message?: string;
  }>(`/manager/apartments/${id}`, {
    method: 'DELETE',
  });
}

/*
|--------------------------------------------------------------------------
| Flats
|--------------------------------------------------------------------------
*/

export async function getManagerFlats() {
  return apiRequest<ListResponse<Flat>>(
    '/manager/flats'
  );
}

export async function createManagerFlat(
  values: FlatFormValues
) {
  return apiRequest<{
    success: boolean;
    message?: string;
    data: Flat;
  }>('/manager/flats', {
    method: 'POST',
    body: JSON.stringify({
      apartment_id: values.apartment_id,
      flat_number: values.flat_number,
      floor: values.floor,
      rent_amount: values.rent_amount,
      status: values.status,
    }),
  });
}

export async function updateManagerFlat(
  id: RecordId,
  values: FlatFormValues
) {
  return apiRequest<{
    success: boolean;
    message?: string;
    data: Flat;
  }>(`/manager/flats/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      apartment_id: values.apartment_id,
      flat_number: values.flat_number,
      floor: values.floor,
      rent_amount: values.rent_amount,
      status: values.status,
    }),
  });
}

export async function deleteManagerFlat(
  id: RecordId
) {
  return apiRequest<{
    success: boolean;
    message?: string;
  }>(`/manager/flats/${id}`, {
    method: 'DELETE',
  });
}

/*
|--------------------------------------------------------------------------
| Tenants
|--------------------------------------------------------------------------
*/

export interface ManagerTenant {
  id: RecordId;

  name: string;

  email?: string | null;

  phone?: string | null;

  flat?: string | null;

  flatNumber?: string | null;

  apartment?: string | null;

  apartmentName?: string | null;

  contact?: string | null;

  lease?: string | null;

  leasePeriod?: string | null;

  rentStatus?: string | null;

  accountStatus?: string | null;

  monthlyRent?: number | null;

  [key: string]: unknown;
}

export interface EligibleTenantUser {
  id: RecordId;

  name: string;

  email: string;

  phone?: string | null;
}

export interface TenantOnboardingValues {
  user_id: RecordId;

  flat_id?: RecordId | null;

  move_in_date?: string | null;

  lease_start?: string | null;

  lease_end?: string | null;
}

export interface ManagerTenantResponse {
  success: boolean;

  message?: string;

  data: Record<string, unknown>;
}

export async function getManagerTenants() {
  return apiRequest<ListResponse<ManagerTenant>>(
    '/manager/tenants'
  );
}

export async function getManagerEligibleTenants() {
  return apiRequest<{
    success: boolean;
    data: EligibleTenantUser[];
  }>('/manager/eligible-tenants');
}

export async function onboardManagerTenant(
  values: TenantOnboardingValues
) {
  return apiRequest<ManagerTenantResponse>(
    '/manager/tenants/onboard',
    {
      method: 'POST',
      body: JSON.stringify(values),
    }
  );
}

/*
|--------------------------------------------------------------------------
| Rent Payments
|--------------------------------------------------------------------------
*/

export async function getManagerRentPayments() {
  return apiRequest<ListResponse<RentPayment>>(
    '/manager/rent-payments'
  );
}

/*
|--------------------------------------------------------------------------
| Utility Bills
|--------------------------------------------------------------------------
*/

export interface ManagerUtilityBill {
  id: RecordId;

  tenantName?: string | null;

  tenant?: string | null;

  flatNumber?: string | null;

  flat?: string | null;

  apartmentName?: string | null;

  apartment?: string | null;

  electricity?: number | null;

  water?: number | null;

  gas?: number | null;

  month?: string | null;

  total?: number | null;

  dueDate?: string | null;

  paidDate?: string | null;

  status: string;

  [key: string]: unknown;
}

export async function getManagerUtilityBills() {
  return apiRequest<ListResponse<ManagerUtilityBill>>(
    '/manager/utility-bills'
  );
}

/*
|--------------------------------------------------------------------------
| Complaints
|--------------------------------------------------------------------------
*/

export async function getManagerComplaints() {
  return apiRequest<ListResponse<Complaint>>(
    '/manager/complaints'
  );
}

export async function updateManagerComplaint(
  id: RecordId,
  values: ComplaintResponseValues
) {
  return apiRequest<{
    success: boolean;
    message?: string;
    data: Complaint;
  }>(`/manager/complaints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
}

/*
|--------------------------------------------------------------------------
| Notices
|--------------------------------------------------------------------------
*/

export async function getManagerNotices() {
  return apiRequest<ListResponse<Notice>>(
    '/manager/notices'
  );
}

export async function createManagerNotice(
  values: NoticeFormValues
) {
  return apiRequest<{
    success: boolean;
    message?: string;
    data: Notice;
  }>('/manager/notices', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export async function updateManagerNotice(
  id: RecordId,
  values: NoticeFormValues
) {
  return apiRequest<{
    success: boolean;
    message?: string;
    data: Notice;
  }>(`/manager/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(values),
  });
}

export async function deleteManagerNotice(
  id: RecordId
) {
  return apiRequest<{
    success: boolean;
    message?: string;
  }>(`/manager/notices/${id}`, {
    method: 'DELETE',
  });
}