<?php

namespace Tests\Feature;

use App\Models\Apartment;
use App\Models\Flat;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantResidenceSelectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_only_sees_their_managers_apartments_and_vacant_flats(): void
    {
        [$tenantUser, $manager, $otherManager] = $this->users();

        $availableApartment = Apartment::create([
            'name' => 'Hoque',
            'address' => 'Dhaka',
            'manager_id' => $manager->id,
        ]);
        $hiddenApartment = Apartment::create([
            'name' => 'Other Manager Property',
            'address' => 'Dhaka',
            'manager_id' => $otherManager->id,
        ]);

        $vacantFlat = $this->flat($availableApartment, '1A', 'vacant');
        $this->flat($availableApartment, '2A', 'occupied');
        $this->flat($hiddenApartment, '9A', 'vacant');

        Tenant::create([
            'user_id' => $tenantUser->id,
            'manager_id' => $manager->id,
        ]);

        Sanctum::actingAs($tenantUser);

        $this->getJson('/api/tenant/available-apartments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $availableApartment->id)
            ->assertJsonMissing(['id' => $hiddenApartment->id]);

        $this->getJson("/api/tenant/apartments/{$availableApartment->id}/available-flats")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $vacantFlat->id);

        $this->getJson("/api/tenant/apartments/{$hiddenApartment->id}/available-flats")
            ->assertNotFound();
    }

    public function test_tenant_can_claim_a_vacant_flat_once(): void
    {
        [$tenantUser, $manager] = $this->users();

        $apartment = Apartment::create([
            'name' => 'Hoque',
            'address' => 'Dhaka',
            'manager_id' => $manager->id,
        ]);
        $flat = $this->flat($apartment, '1A', 'vacant');
        $otherFlat = $this->flat($apartment, '1B', 'vacant');
        $tenant = Tenant::create([
            'user_id' => $tenantUser->id,
            'manager_id' => $manager->id,
        ]);

        Sanctum::actingAs($tenantUser);

        $this->patchJson('/api/tenant/residence', [
            'apartment_id' => $apartment->id,
            'flat_id' => $flat->id,
        ])->assertOk()
            ->assertJsonPath('data.flat.id', $flat->id);

        $this->assertSame($flat->id, $tenant->fresh()->flat_id);
        $this->assertSame('occupied', $flat->fresh()->status);

        $this->patchJson('/api/tenant/residence', [
            'apartment_id' => $apartment->id,
            'flat_id' => $otherFlat->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('flat_id');

        $this->assertSame('vacant', $otherFlat->fresh()->status);
    }

    public function test_tenant_cannot_claim_another_managers_or_an_occupied_flat(): void
    {
        [$tenantUser, $manager, $otherManager] = $this->users();

        $ownApartment = Apartment::create([
            'name' => 'Hoque',
            'address' => 'Dhaka',
            'manager_id' => $manager->id,
        ]);
        $otherApartment = Apartment::create([
            'name' => 'Hidden',
            'address' => 'Dhaka',
            'manager_id' => $otherManager->id,
        ]);
        $occupiedFlat = $this->flat($ownApartment, '1A', 'occupied');
        $otherManagersFlat = $this->flat($otherApartment, '9A', 'vacant');

        Tenant::create([
            'user_id' => $tenantUser->id,
            'manager_id' => $manager->id,
        ]);

        Sanctum::actingAs($tenantUser);

        $this->patchJson('/api/tenant/residence', [
            'apartment_id' => $ownApartment->id,
            'flat_id' => $occupiedFlat->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('flat_id');

        $this->patchJson('/api/tenant/residence', [
            'apartment_id' => $otherApartment->id,
            'flat_id' => $otherManagersFlat->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('apartment_id');
    }

    private function users(): array
    {
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $tenantRole = Role::firstOrCreate(['name' => 'tenant']);

        return [
            User::factory()->create(['role_id' => $tenantRole->id]),
            User::factory()->create(['role_id' => $managerRole->id]),
            User::factory()->create(['role_id' => $managerRole->id]),
        ];
    }

    private function flat(Apartment $apartment, string $number, string $status): Flat
    {
        return Flat::create([
            'apartment_id' => $apartment->id,
            'flat_number' => $number,
            'floor' => 1,
            'rent_amount' => 15000,
            'status' => $status,
        ]);
    }
}
