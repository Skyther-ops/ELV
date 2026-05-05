<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class License extends Model
{
    protected $fillable = [
        'tender_id', 'company', 'project_code', 'do_no', 'quotation_no',
        'client_name', 'product_name', 'serial_no',
        'start_date', 'expiry_date', 'validity_period',
        'acknowledged', 'last_notified_at', 'created_by',
        'completed', 'completed_at',
    ];

    protected $casts = [
        'start_date'       => 'date:Y-m-d',
        'expiry_date'      => 'date:Y-m-d',
        'acknowledged'     => 'boolean',
        'completed'        => 'boolean',
        'completed_at'     => 'datetime',
        'last_notified_at' => 'datetime',
    ];

    public function tender(): BelongsTo
    {
        return $this->belongsTo(Tender::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
