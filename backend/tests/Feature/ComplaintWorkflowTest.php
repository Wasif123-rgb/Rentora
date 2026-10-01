<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ComplaintWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_complaint_submission_and_manager_feedback_workflow(): void
    {
        $managerRole = Role::create(['name' => 'manager']);
        $tenantRole = Role::create(['name' => 'tenant']);
        $manager = User::factory()->create(['role_id' => $managerRole->id]);
        $tenantUser = User::factory()->create(['role_id' => $tenantRole->id]);
        $otherTenantUser = User::factory()->create(['role_id' => $tenantRole->id]);

        Sanctum::actingAs($tenantUser);
        $submission = $this->postJson('/api/tenant/complaints', [
            'tenant_id' => 999,
            'submitted_by' => $otherTenantUser->id,
            'title' => 'No water',
            'apartment_unit' => 'ayesha',
            'category' => 'Plumbing',
            'priority' => 'High',
            'description' => 'No water is here.',
            'preferred_contact_method' => 'Phone',
        ])->assertCreated()
            ->assertJsonPath('complaint.tenant_id', null)
            ->assertJsonPath('complaint.submitted_by', $tenantUser->id)
            ->assertJsonPath('complaint.apartment_unit', 'ayesha');

        $complaintId = $submission->json('complaint.id');

        Sanctum::actingAs($manager);
        $this->getJson('/api/manager/complaints')
            ->assertOk()
            ->assertJsonPath('data.0.id', $complaintId)
            ->assertJsonPath('data.0.submitter.id', $tenantUser->id)
            ->assertJsonPath('data.0.apartment_unit', 'ayesha');

        $this->patchJson("/api/manager/complaints/{$complaintId}", [
            'status' => 'in_progress',
            'manager_feedback' => 'A plumber has been assigned and will attend tomorrow.',
        ])->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.responded_by', $manager->id);

        Sanctum::actingAs($tenantUser);
        $this->getJson('/api/tenant/complaints')
            ->assertOk()
            ->assertJsonPath('complaints.data.0.id', $complaintId)
            ->assertJsonPath('complaints.data.0.manager_feedback', 'A plumber has been assigned and will attend tomorrow.');

        Sanctum::actingAs($otherTenantUser);
        $this->getJson('/api/tenant/complaints')
            ->assertOk()
            ->assertJsonMissing(['id' => $complaintId]);
    }

    public function test_tenant_history_only_contains_authenticated_users_complaints(): void
    {
        $tenantRole = Role::create(['name' => 'tenant']);
        $firstUser = User::factory()->create(['role_id' => $tenantRole->id]);
        $secondUser = User::factory()->create(['role_id' => $tenantRole->id]);

        Sanctum::actingAs($firstUser);
        $this->postJson('/api/tenant/complaints', [
            'title' => 'No water',
            'apartment_unit' => 'House 2',
            'category' => 'Plumbing',
            'priority' => 'High',
            'description' => 'No water is available in the apartment.',
            'preferred_contact_method' => 'Phone',
        ])->assertCreated();

        Sanctum::actingAs($secondUser);
        $this->getJson('/api/tenant/complaints')
            ->assertOk()
            ->assertJsonCount(0, 'complaints.data');
    }
}
