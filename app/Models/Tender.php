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
        'delivery_order', 'invoice_document',
        'project_progress_files', 'project_folder_files',
        'sourcing_files', 'quotation_files',
        'verified_by', 'verified_at', 'approved_by', 'approved_at',
        'verifier_signature', 'approver_signature'
    ];

    protected $casts = [
        'date'                   => 'date:Y-m-d',
        'bg_issue_date'          => 'date:Y-m-d',
        'po_client'              => 'array',
        'pr_po_procurement'      => 'array',
        'delivery_order'         => 'array',
        'invoice_document'       => 'array',
        'project_progress_files' => 'array',
        'project_folder_files'   => 'array',
        'sourcing_files'         => 'array',
        'quotation_files'        => 'array',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
