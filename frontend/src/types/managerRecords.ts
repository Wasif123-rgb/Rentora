export type RecordId = number | string;


/* -------------------------------------------------------------------------- */
/* Apartments                                                                 */
/* -------------------------------------------------------------------------- */

export type ApartmentStatus = 'active' | 'inactive';

export interface Apartment {
  id: RecordId;

  name: string;
  address: string;

  manager_id?: RecordId | null;

  created_at?: string | null;
  updated_at?: string | null;

  flats?: Flat[] | null;

  total_flats?: number;
  occupied_flats?: number;
  vacant_flats?: number;
}

export type ApartmentFormValues = {
  name: string;
  address: string;
};


/* -------------------------------------------------------------------------- */
/* Flats                                                                       */
/* -------------------------------------------------------------------------- */

export type FlatStatus = 'vacant' | 'occupied';

export interface Flat {
  id: RecordId;

  apartment_id: RecordId;

  flat_number: string;
  floor: number;
  rent_amount: number;
  status: FlatStatus;

  apartment?: Apartment | null;
  tenant?: Tenant | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export type FlatFormValues = {
  apartment_id: RecordId | '';
  flat_number: string;
  floor: number | '';
  rent_amount: number | '';
  status: FlatStatus;
};


/* -------------------------------------------------------------------------- */
/* Tenants                                                                     */
/* -------------------------------------------------------------------------- */

export interface TenantUser {
  id: RecordId;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface Tenant {
  id: RecordId;

  user_id: RecordId;
  flat_id: RecordId;

  move_in_date: string;
  lease_start: string;
  lease_end: string;

  user?: TenantUser | null;
  flat?: Flat | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export type TenantFormValues = {
  user_id: RecordId | '';
  flat_id: RecordId | '';
  move_in_date: string;
  lease_start: string;
  lease_end: string;
};


/* -------------------------------------------------------------------------- */
/* Rent Payments                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Calculated payment status used by the frontend payment-status utility.
 */
export type PaymentStatus =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'partially_paid'
  | 'partially_paid_overdue';

/**
 * Status stored in the rent_payments database table.
 */
export type RentPaymentStatus = 'paid' | 'pending';

export interface RentPayment {
  id: RecordId;

  tenant_id: RecordId;

  amount: number;
  payment_date: string;
  status: RentPaymentStatus;

  tenant?: Tenant | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export type RentPaymentFormValues = {
  tenant_id: RecordId | '';
  amount: number | '';
  payment_date: string;
  status: RentPaymentStatus;
};


/* -------------------------------------------------------------------------- */
/* Utility Bills                                                               */
/* -------------------------------------------------------------------------- */

export type UtilityBillStatus = 'paid' | 'unpaid';

export interface UtilityBill {
  id: RecordId;

  tenant_id: RecordId;

  type: string;
  amount: number;
  billing_month: string;
  status: UtilityBillStatus;

  tenant?: Tenant | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export type UtilityBillFormValues = {
  tenant_id: RecordId | '';
  type: string;
  amount: number | '';
  billing_month: string;
  status: UtilityBillStatus;
};


/* -------------------------------------------------------------------------- */
/* Complaints                                                                  */
/* -------------------------------------------------------------------------- */

export type ComplaintStatus =
  | 'open'
  | 'in_progress'
  | 'resolved';

export interface Complaint {
  id: RecordId;

  tenant_id?: RecordId | null;
  submitted_by: RecordId;

  title: string;
  apartment_unit?: string | null;
  category: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  description: string;
  preferred_contact_method: 'Email' | 'Phone' | 'WhatsApp';
  status: ComplaintStatus;
  manager_feedback?: string | null;
  responded_by?: RecordId | null;
  responded_at?: string | null;

  tenant?: Tenant | null;
  submitter?: TenantUser | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export type ComplaintFormValues = {
  tenant_id: RecordId | '';
  title: string;
  category: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  description: string;
  preferred_contact_method: 'Email' | 'Phone' | 'WhatsApp';
  status: ComplaintStatus;
};

export type ComplaintResponseValues = {
  status: ComplaintStatus;
  manager_feedback: string;
};


/* -------------------------------------------------------------------------- */
/* Maintenance Requests                                                       */
/* -------------------------------------------------------------------------- */

export type MaintenanceStatus =
  | 'pending'
  | 'in_progress'
  | 'completed';

export interface MaintenanceAssignedUser {
  id: RecordId;
  name: string;
  email?: string | null;
}

export interface MaintenanceRequest {
  id: RecordId;

  complaint_id: RecordId;

  assigned_to?: RecordId | null;

  remarks?: string | null;
  status: MaintenanceStatus;

  complaint?: Complaint | null;
  assigned_user?: MaintenanceAssignedUser | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export type MaintenanceRequestFormValues = {
  complaint_id: RecordId | '';
  assigned_to?: RecordId | '';
  remarks?: string;
  status: MaintenanceStatus;
};


/* -------------------------------------------------------------------------- */
/* Notices                                                                     */
/* -------------------------------------------------------------------------- */

export interface Notice {
  id: RecordId;

  published_by: RecordId;

  title: string;
  content: string;

  created_at?: string | null;
  updated_at?: string | null;
}

export type NoticeFormValues = {
  title: string;
  content: string;
};


/* -------------------------------------------------------------------------- */
/* API                                                                         */
/* -------------------------------------------------------------------------- */

export interface ListResponse<T> {
  data: T[];
  message?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
}

export interface MutationState {
  submitting?: boolean;
  successMessage?: string | null;
  apiError?: string | null;
}
