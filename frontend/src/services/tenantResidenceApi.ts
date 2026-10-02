import { apiRequest } from "./api";

export interface AvailableApartment {
  id: number;
  name: string;
  address: string;
}

export interface AvailableFlat {
  id: number;
  apartment_id: number;
  flat_number: string;
  floor: number;
  rent_amount: number;
  status: "vacant";
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

export function getAvailableApartments() {
  return apiRequest<ApiListResponse<AvailableApartment>>(
    "/tenant/available-apartments"
  );
}

export function getAvailableFlats(apartmentId: number) {
  return apiRequest<ApiListResponse<AvailableFlat>>(
    `/tenant/apartments/${apartmentId}/available-flats`
  );
}

export function assignResidence(apartmentId: number, flatId: number) {
  return apiRequest<{ success: boolean; message: string }>(
    "/tenant/residence",
    {
      method: "PATCH",
      body: JSON.stringify({
        apartment_id: apartmentId,
        flat_id: flatId,
      }),
    }
  );
}
