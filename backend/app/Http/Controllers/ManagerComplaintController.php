<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ManagerComplaintController extends Controller
{
    /**
     * Display submitted complaints for managers.
     */
    public function index(Request $request)
    {
        $complaints = Complaint::with([
            'submitter',
            'tenant.user',
            'responder',
        ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $complaints,
        ]);
    }

    /**
     * Display one complaint.
     */
    public function show(
        Request $request,
        Complaint $complaint
    ) {
        $complaint->load([
            'submitter',
            'tenant.user',
            'maintenanceRequests',
            'responder',
        ]);

        return response()->json([
            'success' => true,
            'data' => $complaint,
        ]);
    }

    /**
     * Update a complaint.
     */
    public function update(
        Request $request,
        Complaint $complaint
    ) {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                Rule::in([
                    'open',
                    'in_progress',
                    'resolved',
                ]),
            ],

            'manager_feedback' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        if (array_key_exists('manager_feedback', $validated)) {
            $validated['responded_by'] = $request->user()->id;
            $validated['responded_at'] = now();
        }

        $complaint->update($validated);

        $complaint->load([
            'submitter',
            'tenant.user',
            'maintenanceRequests',
            'responder',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Complaint updated successfully.',
            'data' => $complaint,
        ]);
    }

}
