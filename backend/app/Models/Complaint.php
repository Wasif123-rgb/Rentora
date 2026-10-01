<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $fillable = [
        'tenant_id',
        'submitted_by',
        'title',
        'apartment_unit',
        'category',
        'priority',
        'description',
        'preferred_contact_method',
        'status',
        'manager_feedback',
        'responded_by',
        'responded_at',
    ];

    protected function casts(): array
    {
        return ['responded_at' => 'datetime'];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function maintenanceRequests()
    {
        return $this->hasMany(MaintenanceRequest::class);
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }
}
