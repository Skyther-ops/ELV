<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tender;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TenderController extends Controller
{
    /** GET /tenders */
    public function index(): JsonResponse
    {
        $tenders = Tender::with('creator:id,name')
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json($tenders);
    }

    /** GET /tenders/{id} */
    public function show(int $id): JsonResponse
    {
        $tender = Tender::with('creator:id,name')->findOrFail($id);
        return response()->json($tender);
    }

    /** POST /tenders */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date'               => ['nullable', 'date'],
            'project_code'       => ['nullable', 'string', 'max:100'],
            'status'             => ['nullable', 'string', 'max:100'],
            'type'               => ['nullable', 'string', 'max:100'],
            'company'            => ['nullable', 'string', 'max:255'],
            'customer'           => ['nullable', 'string', 'max:255'],
            'supplier'           => ['nullable', 'string', 'max:255'],
            'agency_types'       => ['nullable', 'string', 'max:255'],
            'project_title'      => ['nullable', 'string', 'max:500'],
            'person_in_charge'   => ['nullable', 'string', 'max:255'],
            'contact_no'         => ['nullable', 'string', 'max:50'],
            'email'              => ['nullable', 'string', 'max:255'],
            'internal_quotation' => ['nullable', 'string', 'max:255'],
            'sales_price'        => ['nullable', 'numeric'],
            'cost_price'         => ['nullable', 'numeric'],
            'margin'             => ['nullable', 'numeric'],
            'submission_date'    => ['nullable', 'date'],
            'success_rate'       => ['nullable', 'string', 'max:50'],
            'po_client'             => ['nullable', 'string', 'max:255'],
            'bg_document'           => ['nullable', 'string', 'max:255'],
            'bg_issue_date'        => ['nullable', 'date'],
            'pr_po_procurement'     => ['nullable', 'string', 'max:255'],
            'delivery_order'        => ['nullable', 'string', 'max:255'],
            'invoice_document'      => ['nullable', 'string', 'max:255'],
            'project_progress_link' => ['nullable', 'string', 'max:1000'],
            'project_folder_link'   => ['nullable', 'string', 'max:1000'],
            'sourcing_link'         => ['nullable', 'string', 'max:1000'],
            'quotation_link'        => ['nullable', 'string', 'max:1000'],
        ]);

        $data['created_by'] = $request->user()->id;

        $tender = Tender::create($data);
        return response()->json($tender->load('creator:id,name'), 201);
    }

    /** PUT /tenders/{id} */
    public function update(Request $request, int $id): JsonResponse
    {
        $tender = Tender::findOrFail($id);

        $data = $request->validate([
            'date'               => ['nullable', 'date'],
            'project_code'       => ['nullable', 'string', 'max:100'],
            'status'             => ['nullable', 'string', 'max:100'],
            'type'               => ['nullable', 'string', 'max:100'],
            'company'            => ['nullable', 'string', 'max:255'],
            'customer'           => ['nullable', 'string', 'max:255'],
            'supplier'           => ['nullable', 'string', 'max:255'],
            'agency_types'       => ['nullable', 'string', 'max:255'],
            'project_title'      => ['nullable', 'string', 'max:500'],
            'person_in_charge'   => ['nullable', 'string', 'max:255'],
            'contact_no'         => ['nullable', 'string', 'max:50'],
            'email'              => ['nullable', 'string', 'max:255'],
            'internal_quotation' => ['nullable', 'string', 'max:255'],
            'sales_price'        => ['nullable', 'numeric'],
            'cost_price'         => ['nullable', 'numeric'],
            'margin'             => ['nullable', 'numeric'],
            'submission_date'    => ['nullable', 'date'],
            'success_rate'       => ['nullable', 'string', 'max:50'],
            'po_client'             => ['nullable', 'string', 'max:255'],
            'bg_document'           => ['nullable', 'string', 'max:255'],
            'bg_issue_date'        => ['nullable', 'date'],
            'pr_po_procurement'     => ['nullable', 'string', 'max:255'],
            'delivery_order'        => ['nullable', 'string', 'max:255'],
            'invoice_document'      => ['nullable', 'string', 'max:255'],
            'project_progress_link' => ['nullable', 'string', 'max:1000'],
            'project_folder_link'   => ['nullable', 'string', 'max:1000'],
            'sourcing_link'         => ['nullable', 'string', 'max:1000'],
            'quotation_link'        => ['nullable', 'string', 'max:1000'],
        ]);

        $tender->update($data);
        return response()->json($tender->load('creator:id,name'));
    }

    /** DELETE /tenders/{id} */
    public function destroy(int $id): JsonResponse
    {
        Tender::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
