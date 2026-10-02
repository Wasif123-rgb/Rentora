<?php

namespace App\Http\Controllers;

use App\Models\Apartment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManagerApartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $apartments = Apartment::query()
            ->where('manager_id', $request->user()->id)
            ->withCount([
                'flats as total_flats',

                'flats as occupied_flats' => function ($query) {
                    $query->where('status', 'occupied');
                },

                'flats as vacant_flats' => function ($query) {
                    $query->where('status', 'vacant');
                },
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $apartments,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
        ]);

        $apartment = Apartment::create([
            'name' => $validated['name'],
            'address' => $validated['address'],
            'manager_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Apartment created successfully.',
            'data' => $this->withFlatStats($apartment),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $apartment = $this->findOwnedApartment(
            $request->user()->id,
            $id
        );

        $apartment->load('flats');

        $apartment->total_flats = $apartment->flats->count();
        $apartment->occupied_flats = $apartment->flats
            ->where('status', 'occupied')
            ->count();
        $apartment->vacant_flats = $apartment->flats
            ->where('status', 'vacant')
            ->count();

        return response()->json([
            'success' => true,
            'data' => $apartment,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $apartment = $this->findOwnedApartment(
            $request->user()->id,
            $id
        );

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $apartment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Apartment updated successfully.',
            'data' => $this->withFlatStats($apartment->fresh()),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $apartment = $this->findOwnedApartment(
            $request->user()->id,
            $id
        );

        $apartment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Apartment deleted successfully.',
        ]);
    }

    private function withFlatStats(Apartment $apartment): Apartment
    {
        return $apartment
            ->loadCount([
                'flats as total_flats',

                'flats as occupied_flats' => function ($query) {
                    $query->where('status', 'occupied');
                },

                'flats as vacant_flats' => function ($query) {
                    $query->where('status', 'vacant');
                },
            ]);
    }

    private function findOwnedApartment(
        int $managerId,
        int $apartmentId
    ): Apartment {
        return Apartment::query()
            ->where('manager_id', $managerId)
            ->findOrFail($apartmentId);
    }
}