<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tender extends Model
{
    protected $fillable = [
        'created_by', 'date', 'project_code', 'status', 'type',
        'company', 'customer', 'supplier', 'agency_types', 'project_title',
        'person_in_charge', 'contact_no', 'email', 'internal_quotation',
        'sales_price', 'cost_price', 'margin', 'submission_date', 'success_rate',
        'po_client', 'bg_document', 'bg_issue_date', 'pr_po_procurement',
        'delivery_order', 'invoice_document', 'project_progress_link',
        'project_folder_link', 'sourcing_link', 'quotation_link',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'bg_issue_date' => 'date:Y-m-d',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
