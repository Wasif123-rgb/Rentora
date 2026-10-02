<?php

namespace App\Http\Controllers;

use App\Models\Flat;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ManagerTenantController extends Controller
{
    /**
     * List tenants belonging to the authenticated manager.
     *
     * Assigned tenants are owned through their apartment.
     * Unassigned tenants are temporarily owned through tenants.manager_id.
     */
    public function index(Request $request)
    {
        $manager = $request->user();

        $tenants = Tenant::with([
                'user',
                'flat.apartment',
            ])
            ->where(function ($query) use ($manager) {
                $query
                    ->where(function ($unassignedQuery) use ($manager) {
                        $unassignedQuery
                            ->whereNull('flat_id')
                            ->where('manager_id', $manager->id);
                    })
                    ->orWhereHas('flat.apartment', function ($apartmentQuery) use ($manager) {
                        $apartmentQuery->where('manager_id', $manager->id);
                    });
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tenants,
        ]);
    }

    /**
     * Existing tenant creation endpoint.
     *
     * Kept for compatibility with the existing manager tenant CRUD.
     */
    public function store(Request $request)
    {
        return $this->onboard($request);
    }

    /**
     * Return registered users who can be onboarded as tenants.
     *
     * Eligible users:
     * - have the tenant role
     * - do not already have a Tenant record
     */
    public function eligibleTenants(Request $request)
    {
        $users = User::with('role')
            ->whereHas('role', function ($query) {
                $query->where('name', 'tenant');
            })
            ->whereDoesntHave('tenant')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'email',
                'phone',
            ]);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Onboard an already-registered tenant user.
     *
     * A property/flat is optional at this stage.
     */
    public function onboard(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',

            'flat_id' => [
                'nullable',
                'integer',
                'exists:flats,id',
            ],

            'move_in_date' => 'nullable|date',
            'lease_start' => 'nullable|date',
            'lease_end' => 'nullable|date|after_or_equal:lease_start',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $manager = $request->user();

        /*
         * The selected account must actually be a tenant account.
         */
        $tenantUser = User::with('role')->find($request->user_id);

        if (!$tenantUser || $tenantUser->role?->name !== 'tenant') {
            return response()->json([
                'success' => false,
                'message' => 'The selected user is not eligible to be onboarded as a tenant.',
            ], 422);
        }

        /*
         * A registered user can have only one Tenant record.
         */
        if (Tenant::where('user_id', $tenantUser->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This user is already assigned as a tenant.',
            ], 422);
        }

        $flat = null;

        /*
         * A flat is optional.
         *
         * If supplied, it must belong to the authenticated manager.
         */
        if ($request->filled('flat_id')) {
            $flat = Flat::where('id', $request->flat_id)
                ->whereHas('apartment', function ($query) use ($manager) {
                    $query->where('manager_id', $manager->id);
                })
                ->first();

            if (!$flat) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to use this flat.',
                ], 403);
            }

            /*
             * One flat can only have one tenant.
             */
            if ($flat->tenant()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This flat already has a tenant.',
                ], 422);
            }
        }

        /*
         * Create the Tenant record.
         *
         * manager_id keeps ownership with the manager while the tenant
         * has no property selected yet.
         */
        $tenant = Tenant::create([
            'user_id' => $tenantUser->id,
            'manager_id' => $manager->id,
            'flat_id' => $flat?->id,
            'move_in_date' => $request->input('move_in_date'),
            'lease_start' => $request->input('lease_start'),
            'lease_end' => $request->input('lease_end'),
        ]);

        /*
         * If a flat was selected during onboarding, mark it occupied.
         */
        if ($flat) {
            $flat->update([
                'status' => 'occupied',
            ]);
        }

        $tenant->load([
            'user',
            'flat.apartment',
            'manager',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tenant onboarded successfully.',
            'data' => $tenant,
        ], 201);
    }

    public function show(Request $request, Tenant $tenant)
    {
        if (!$this->ownsTenant($request, $tenant)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access this tenant.',
            ], 403);
        }

        $tenant->load([
            'user',
            'flat.apartment',
            'rentPayments',
            'utilityBills',
            'complaints',
        ]);

        return response()->json([
            'success' => true,
            'data' => $tenant,
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        if (!$this->ownsTenant($request, $tenant)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this tenant.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|required|integer|exists:users,id',
            'flat_id' => 'sometimes|nullable|integer|exists:flats,id',
            'move_in_date' => 'sometimes|nullable|date',
            'lease_start' => 'sometimes|nullable|date',
            'lease_end' => 'sometimes|nullable|date|after_or_equal:lease_start',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $manager = $request->user();

        /*
         * Validate a replacement user.
         */
        if ($request->has('user_id')) {
            $newUser = User::with('role')->find($request->user_id);

            if (!$newUser || $newUser->role?->name !== 'tenant') {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected user is not a tenant.',
                ], 422);
            }

            $existingTenant = Tenant::where('user_id', $newUser->id)
                ->where('id', '!=', $tenant->id)
                ->exists();

            if ($existingTenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'This user is already assigned as a tenant.',
                ], 422);
            }
        }

        $oldFlatId = $tenant->flat_id;

        /*
         * Validate a replacement flat.
         *
         * null is allowed because a tenant can become unassigned.
         */
        $newFlat = null;

        if ($request->has('flat_id') && $request->filled('flat_id')) {
            $newFlat = Flat::where('id', $request->flat_id)
                ->whereHas('apartment', function ($query) use ($manager) {
                    $query->where('manager_id', $manager->id);
                })
                ->first();

            if (!$newFlat) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to use this flat.',
                ], 403);
            }

            if (
                $newFlat->id !== $tenant->flat_id &&
                $newFlat->tenant()->exists()
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected flat already has a tenant.',
                ], 422);
            }
        }

        $updateData = [];

        foreach ([
            'user_id',
            'flat_id',
            'move_in_date',
            'lease_start',
            'lease_end',
        ] as $field) {
            if ($request->has($field)) {
                $updateData[$field] = $request->input($field);
            }
        }

        /*
         * If the flat assignment changes, retain the authenticated manager
         * as the temporary ownership record.
         */
        if ($request->has('flat_id')) {
            $updateData['manager_id'] = $manager->id;
        }

        $tenant->update($updateData);

        /*
         * Synchronize flat occupancy whenever the assigned flat changes.
         */
        if (
            $request->has('flat_id') &&
            $request->input('flat_id') != $oldFlatId
        ) {
            if ($oldFlatId) {
                Flat::where('id', $oldFlatId)->update([
                    'status' => 'vacant',
                ]);
            }

            if ($newFlat) {
                $newFlat->update([
                    'status' => 'occupied',
                ]);
            }
        }

        $tenant->load([
            'user',
            'flat.apartment',
            'manager',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tenant updated successfully.',
            'data' => $tenant,
        ]);
    }

    public function destroy(Request $request, Tenant $tenant)
    {
        if (!$this->ownsTenant($request, $tenant)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this tenant.',
            ], 403);
        }

        $flat = $tenant->flat;

        $tenant->rentPayments()->delete();
        $tenant->utilityBills()->delete();

        foreach ($tenant->complaints as $complaint) {
            $complaint->maintenanceRequests()->delete();
            $complaint->delete();
        }

        $tenant->delete();

        /*
         * A released tenant flat becomes vacant.
         */
        if ($flat) {
            $flat->update([
                'status' => 'vacant',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tenant deleted successfully.',
        ]);
    }

    /**
     * Determine whether the authenticated manager owns this tenant.
     *
     * Assigned tenants:
     *   tenant -> flat -> apartment -> manager
     *
     * Unassigned tenants:
     *   tenant -> manager_id
     */
    private function ownsTenant(Request $request, Tenant $tenant): bool
    {
        $managerId = $request->user()->id;

        if ($tenant->flat_id !== null) {
            return $tenant->flat()
                ->whereHas('apartment', function ($query) use ($managerId) {
                    $query->where('manager_id', $managerId);
                })
                ->exists();
        }

        return (int) $tenant->manager_id === (int) $managerId;
    }
}