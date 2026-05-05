<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tender;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Api\WorkflowControllerTrait;

class TenderController extends Controller
{
    use WorkflowControllerTrait;

    protected function getModel($id) {
        return Tender::findOrFail($id);
    }
    // Valid file-column keys
    private const FILE_COLUMNS = [
        'po_client',
        'pr_po_procurement',
        'delivery_order',
        'invoice_document',
        'project_progress_files',
        'project_folder_files',
        'sourcing_files',
        'quotation_files',
    ];

    /** GET /tenders */
    public function index(): JsonResponse
    {
        $tenders = Tender::with(['creator:id,name', 'verifier:id,name', 'approver:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json($tenders);
    }

    /** GET /tenders/{id} */
    public function show(int $id): JsonResponse
    {
        $tender = Tender::with(['creator:id,name', 'verifier:id,name', 'approver:id,name'])->findOrFail($id);
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
        ]);

        $data['created_by'] = $request->user()->id;

        $tender = Tender::create($data);
        return response()->json($tender->load(['creator:id,name', 'verifier:id,name', 'approver:id,name']), 201);
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
            'bg_document'        => ['nullable', 'string', 'max:255'],
            'bg_issue_date'      => ['nullable', 'date'],
        ]);

        $tender->update($data);
        return response()->json($tender->load(['creator:id,name', 'verifier:id,name', 'approver:id,name']));
    }

    /**
     * POST /tenders/{id}/upload-files
     * Body: multipart with field "column" and "files[]"
     */
    public function uploadFiles(Request $request, int $id): JsonResponse
    {
        $tender = Tender::findOrFail($id);

        $request->validate([
            'column'  => ['required', 'string', 'in:' . implode(',', self::FILE_COLUMNS)],
            'files'   => ['required', 'array', 'min:1'],
            'files.*' => ['file', 'mimes:pdf', 'max:20480'], // 20 MB each
        ]);

        $column   = $request->input('column');
        $existing = $tender->$column ?? [];

        $newPaths = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store("tenders/{$id}/{$column}", 'public');
            $newPaths[] = [
                'name' => $file->getClientOriginalName(),
                'path' => $path,
                'url'  => rtrim(config('app.url'), '/') . '/api/storage/' . $path,
            ];
        }

        $tender->$column = array_merge($existing, $newPaths);
        $tender->save();

        return response()->json($tender->load('creator:id,name'));
    }

    /**
     * DELETE /tenders/{id}/files
     * Body JSON: { "column": "project_progress_files", "path": "tenders/1/..." }
     */
    public function deleteFile(Request $request, int $id): JsonResponse
    {
        $tender = Tender::findOrFail($id);

        $request->validate([
            'column' => ['required', 'string', 'in:' . implode(',', self::FILE_COLUMNS)],
            'path'   => ['required', 'string'],
        ]);

        $column  = $request->input('column');
        $path    = $request->input('path');
        $files   = $tender->$column ?? [];

        // Remove the specific file
        $files = array_values(array_filter($files, fn($f) => $f['path'] !== $path));

        // Delete from disk
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $tender->$column = $files;
        $tender->save();

        return response()->json($tender->load('creator:id,name'));
    }

    /** DELETE /tenders/{id} */
    public function destroy(int $id): JsonResponse
    {
        $tender = Tender::findOrFail($id);

        // Clean up all uploaded files
        foreach (self::FILE_COLUMNS as $col) {
            foreach (($tender->$col ?? []) as $f) {
                if (Storage::disk('public')->exists($f['path'])) {
                    Storage::disk('public')->delete($f['path']);
                }
            }
        }

        $tender->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
