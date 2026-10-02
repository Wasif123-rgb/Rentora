<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'user_id',
        'manager_id',
        'flat_id',
        'move_in_date',
        'lease_start',
        'lease_end',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function flat()
    {
        return $this->belongsTo(Flat::class);
    }

    public function rentPayments()
    {
        return $this->hasMany(RentPayment::class);
    }

    public function utilityBills()
    {
        return $this->hasMany(UtilityBill::class);
    }

    public function complaints()
    {
        return $this->hasMany(Complaint::class);
    }
}