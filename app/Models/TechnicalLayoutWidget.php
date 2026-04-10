<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TechnicalLayoutWidget extends Model
{
    protected $fillable = [
        'technical_layout_id',
        'technical_layout_zone_id',
        'type',
        'color_theme',
        'x_pos',
        'y_pos',
        'status',
        'metadata'
    ];

    protected $casts = [
        'x_pos' => 'decimal:4',
        'y_pos' => 'decimal:4',
        'metadata' => 'array'
    ];

    public function technicalLayout()
    {
        return $this->belongsTo(\App\Models\TechnicalLayout::class);
    }

    public function technicalLayoutZone()
    {
        return $this->belongsTo(\App\Models\TechnicalLayoutZone::class);
    }
}
