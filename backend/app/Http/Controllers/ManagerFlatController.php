<?php

namespace App\Http\Controllers;

use App\Models\Apartment;
use App\Models\Flat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ManagerFlatController extends Controller
{
    /**
     * List all flats belonging to the authenticated manager.
     */
    public function index(Request $request)
    {
        $manager = $request->user();

        $flats = Flat::with([
            'apartment',
            'tenant.user',
        ])
            ->whereHas('apartment', function ($query) use ($manager) {
                $query->where('manager_id', $manager->id);
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $flats,
        ]);
    }

    /**
     * Create a flat under one of the manager's apartments.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'apartment_id' => 'required|integer|exists:apartments,id',
            'flat_number' => 'required|string|max:50',
            'floor' => 'required|integer|min:0',
            'rent_amount' => 'required|numeric|min:0',
            'status' => 'nullable|in:vacant,occupied',
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
         * IMPORTANT:
         * Never trust apartment_id by itself.
         *
         * Verify that the apartment belongs to this manager.
         */
        $apartment = Apartment::where('id', $request->apartment_id)
            ->where('manager_id', $manager->id)
            ->first();

        if (!$apartment) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to use this apartment.',
            ], 403);
        }

        // Prevent duplicate flat numbers inside the same apartment.
        $duplicate = Flat::where('apartment_id', $apartment->id)
            ->where('flat_number', $request->flat_number)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'This flat number already exists in this apartment.',
            ], 422);
        }

        $flat = Flat::create([
            'apartment_id' => $apartment->id,
            'flat_number' => $request->flat_number,
            'floor' => $request->floor,
            'rent_amount' => $request->rent_amount,
            'status' => $request->status ?? 'vacant',
        ]);

        /*
         * Load the apartment and tenant/user relationship so the
         * frontend receives the same structure as the list endpoint.
         */
        $flat->load([
            'apartment',
            'tenant.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Flat created successfully.',
            'data' => $flat,
        ], 201);
    }

    /**
     * Show one flat belonging to the authenticated manager.
     */
    public function show(Request $request, Flat $flat)
    {
        if (!$this->ownsFlat($request, $flat)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access this flat.',
            ], 403);
        }

        $flat->load([
            'apartment',
            'tenant.user',
        ]);

        return response()->json([
            'success' => true,
            'data' => $flat,
        ]);
    }

    /**
     * Update a manager-owned flat.
     */
    public function update(Request $request, Flat $flat)
    {
        if (!$this->ownsFlat($request, $flat)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this flat.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'apartment_id' => 'sometimes|required|integer|exists:apartments,id',
            'flat_number' => 'sometimes|required|string|max:50',
            'floor' => 'sometimes|required|integer|min:0',
            'rent_amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:vacant,occupied',
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
         * If apartment_id is being changed, make sure the new
         * apartment also belongs to this manager.
         */
        if ($request->has('apartment_id')) {
            $newApartment = Apartment::where('id', $request->apartment_id)
                ->where('manager_id', $manager->id)
                ->first();

            if (!$newApartment) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to use this apartment.',
                ], 403);
            }
        }

        $apartmentId = $request->input(
            'apartment_id',
            $flat->apartment_id
        );

        $flatNumber = $request->input(
            'flat_number',
            $flat->flat_number
        );

        // Prevent duplicate flat numbers inside the same apartment.
        $duplicate = Flat::where('apartment_id', $apartmentId)
            ->where('flat_number', $flatNumber)
            ->where('id', '!=', $flat->id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'This flat number already exists in this apartment.',
            ], 422);
        }

        $flat->update($request->only([
            'apartment_id',
            'flat_number',
            'floor',
            'rent_amount',
            'status',
        ]));

        /*
         * Load the tenant's user as well, because the frontend uses:
         *
         * item.tenant?.user?.name
         */
        $flat->load([
            'apartment',
            'tenant.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Flat updated successfully.',
            'data' => $flat,
        ]);
    }

    /**
     * Delete a manager-owned flat.
     */
    public function destroy(Request $request, Flat $flat)
    {
        if (!$this->ownsFlat($request, $flat)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this flat.',
            ], 403);
        }

        /*
         * A tenant belongs to a flat, so don't allow deleting
         * an occupied flat through this endpoint.
         */
        if ($flat->tenant()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a flat that has a tenant.',
            ], 422);
        }

        $flat->delete();

        return response()->json([
            'success' => true,
            'message' => 'Flat deleted successfully.',
        ]);
    }

    /**
     * Check whether a flat belongs to the authenticated manager.
     */
    private function ownsFlat(Request $request, Flat $flat): bool
    {
        return $flat->apartment()
            ->where('manager_id', $request->user()->id)
            ->exists();
    }
}
