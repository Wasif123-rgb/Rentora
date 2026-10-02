<?php

namespace App\Http\Controllers;

use App\Models\Apartment;
use App\Models\Flat;
use App\Models\Tenant;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class TenantResidenceController extends Controller
{
    public function apartments(Request $request)
    {
        $tenant = $this->tenantForUser($request);

        if (!$tenant) {
            return $this->missingTenantResponse();
        }

        if (!$tenant->manager_id) {
            return response()->json([
                'success' => false,
                'message' => 'No property manager is assigned to your tenant account.',
            ], 422);
        }

        $apartments = Apartment::query()
            ->where('manager_id', $tenant->manager_id)
            ->orderBy('name')
            ->get(['id', 'name', 'address']);

        return response()->json([
            'success' => true,
            'data' => $apartments,
        ]);
    }

    public function flats(Request $request, Apartment $apartment)
    {
        $tenant = $this->tenantForUser($request);

        if (!$tenant) {
            return $this->missingTenantResponse();
        }

        if (!$tenant->manager_id || (int) $apartment->manager_id !== (int) $tenant->manager_id) {
            return response()->json([
                'success' => false,
                'message' => 'This apartment is not available to your tenant account.',
            ], 404);
        }

        $flats = $apartment->flats()
            ->where('status', 'vacant')
            ->orderBy('flat_number')
            ->get(['id', 'apartment_id', 'flat_number', 'floor', 'rent_amount', 'status']);

        return response()->json([
            'success' => true,
            'data' => $flats,
        ]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'apartment_id' => 'required|integer|exists:apartments,id',
            'flat_id' => 'required|integer|exists:flats,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $tenant = $this->tenantForUser($request);

        if (!$tenant) {
            return $this->missingTenantResponse();
        }

        if (!$tenant->manager_id) {
            return response()->json([
                'success' => false,
                'message' => 'No property manager is assigned to your tenant account.',
            ], 422);
        }

        try {
            $assignedTenant = DB::transaction(function () use ($request, $tenant) {
                $lockedTenant = Tenant::query()
                    ->where('id', $tenant->id)
                    ->where('user_id', $request->user()->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedTenant->flat_id !== null) {
                    throw ValidationException::withMessages([
                        'flat_id' => ['A residence is already assigned to this tenant.'],
                    ]);
                }

                $apartment = Apartment::query()
                    ->where('id', $request->integer('apartment_id'))
                    ->where('manager_id', $lockedTenant->manager_id)
                    ->first();

                if (!$apartment) {
                    throw ValidationException::withMessages([
                        'apartment_id' => ['The selected apartment is not available to your tenant account.'],
                    ]);
                }

                $flat = Flat::query()
                    ->where('id', $request->integer('flat_id'))
                    ->where('apartment_id', $apartment->id)
                    ->lockForUpdate()
                    ->first();

                if (!$flat) {
                    throw ValidationException::withMessages([
                        'flat_id' => ['The selected flat does not belong to the selected apartment.'],
                    ]);
                }

                if ($flat->status !== 'vacant') {
                    throw ValidationException::withMessages([
                        'flat_id' => ['The selected flat is no longer vacant.'],
                    ]);
                }

                $lockedTenant->update(['flat_id' => $flat->id]);
                $flat->update(['status' => 'occupied']);

                return $lockedTenant->load('flat.apartment');
            });
        } catch (QueryException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'The selected flat is no longer available.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Residence selected successfully.',
            'data' => $assignedTenant,
        ]);
    }

    private function tenantForUser(Request $request): ?Tenant
    {
        return Tenant::where('user_id', $request->user()->id)->first();
    }

    private function missingTenantResponse()
    {
        return response()->json([
            'success' => false,
            'message' => 'You have not yet been assigned as a tenant.',
        ], 404);
    }
}
