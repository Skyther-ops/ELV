<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenderCostingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'tender_id', 'item_name', 'supplier', 'quantity', 'unit_cost', 'unit_price', 'has_sst', 'has_costing_sst', 'details', 'quotation_breakdown',
    ];

    protected $casts = [
        'has_sst' => 'boolean',
        'has_costing_sst' => 'boolean',
    ];

    public function tender(): BelongsTo
    {
        return $this->belongsTo(Tender::class);
    }
}
