<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PduChecklist extends Model
{
    protected $fillable = [
        'project_id',
        'pdu_ref_no',
        'record_date',
        'units_data',
        'meta_data'
    ];

    protected $casts = [
        'units_data' => 'array',
        'meta_data' => 'array',
        'record_date' => 'date:Y-m-d'
    ];
}
