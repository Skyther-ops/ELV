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
        $tenders = Tender::with(['creator:id,name', 'checker:id,name', 'verifier:id,name', 'approver:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json($tenders);
    }

    /** GET /tenders/{id} */
    public function show(int $id): JsonResponse
    {
        $tender = Tender::with(['creator:id,name', 'checker:id,name', 'verifier:id,name', 'approver:id,name'])->findOrFail($id);
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
        $this->autoPopulateMasterList($tender);

        // Notify supervisors/superadmins of the newly created tender
        $code = $tender->project_code ?? 'N/A';
        $title = $tender->project_title ?? '';
        $message = "[Tender] New tender added: $code" . ($title ? " ($title)" : "") . " by " . $request->user()->name;
        $url = '/businesses/tenders';

        $notifiables = \App\Models\User::whereIn('role', ['supervisor', 'superadmin', 'business_admin'])->get();
        \Illuminate\Support\Facades\Notification::send($notifiables, new \App\Notifications\VerificationRequested([
            'message' => $message,
            'url' => $url,
            'id' => $tender->id,
            'type' => 'Tender'
        ]));

        return response()->json($tender->load(['creator:id,name', 'checker:id,name', 'verifier:id,name', 'approver:id,name']), 201);
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
        $this->autoPopulateMasterList($tender);
        return response()->json($tender->load(['creator:id,name', 'checker:id,name', 'verifier:id,name', 'approver:id,name']));
    }

    /**
     * POST /tenders/{id}/upload-files
     * Body: multipart with field "column" and "files[]"
     */
    public function uploadFiles(Request $request, int $id): JsonResponse
    {
        $tender = Tender::findOrFail($id);

        $customCols = \App\Models\MasterListItem::where('category', 'project_document_title')->pluck('color')->toArray();
        $allowedColumns = array_merge(self::FILE_COLUMNS, $customCols);

        $request->validate([
            'column'  => ['required', 'string', 'in:' . implode(',', $allowedColumns)],
            'files'   => ['required', 'array', 'min:1'],
            'files.*' => ['file', 'max:512000'], // Max 500 MB each, allow other types!
        ]);

        $column   = $request->input('column');
        
        $newPaths = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store("tenders/{$id}/{$column}", 'public');
            $newPaths[] = [
                'name' => $file->getClientOriginalName(),
                'path' => $path,
                'url'  => rtrim(config('app.url'), '/') . '/api/storage/' . $path,
            ];
        }

        if (in_array($column, self::FILE_COLUMNS)) {
            $existing = $tender->$column ?? [];
            $tender->$column = array_merge($existing, $newPaths);
        } else {
            $customDocs = $tender->custom_documents ?? [];
            $existing = $customDocs[$column] ?? [];
            $customDocs[$column] = array_merge($existing, $newPaths);
            $tender->custom_documents = $customDocs;
        }

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

        $customCols = \App\Models\MasterListItem::where('category', 'project_document_title')->pluck('color')->toArray();
        $allowedColumns = array_merge(self::FILE_COLUMNS, $customCols);

        $request->validate([
            'column' => ['required', 'string', 'in:' . implode(',', $allowedColumns)],
            'path'   => ['required', 'string'],
        ]);

        $column  = $request->input('column');
        $path    = $request->input('path');

        if (in_array($column, self::FILE_COLUMNS)) {
            $files = $tender->$column ?? [];
            $files = array_values(array_filter($files, fn($f) => $f['path'] !== $path));
            $tender->$column = $files;
        } else {
            $customDocs = $tender->custom_documents ?? [];
            $files = $customDocs[$column] ?? [];
            $files = array_values(array_filter($files, fn($f) => $f['path'] !== $path));
            $customDocs[$column] = $files;
            $tender->custom_documents = $customDocs;
        }

        // Delete from disk
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $tender->save();

        return response()->json($tender->load('creator:id,name'));
    }

    /** DELETE /tenders/{id} */
    public function destroy(int $id): JsonResponse
    {
        $tender = Tender::findOrFail($id);

        // Clean up all standard uploaded files
        foreach (self::FILE_COLUMNS as $col) {
            foreach (($tender->$col ?? []) as $f) {
                if (Storage::disk('public')->exists($f['path'])) {
                    Storage::disk('public')->delete($f['path']);
                }
            }
        }

        // Clean up custom documents
        foreach (($tender->custom_documents ?? []) as $col => $files) {
            foreach ($files as $f) {
                if (Storage::disk('public')->exists($f['path'])) {
                    Storage::disk('public')->delete($f['path']);
                }
            }
        }

        $tender->delete();
        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Automatically populate the master list configurations with new entries from the tender
     */
    private function autoPopulateMasterList(\App\Models\Tender $tender): void
    {
        $fields = [
            'status'       => 'status',
            'type'         => 'type',
            'company'      => 'company',
            'customer'     => 'customer',
            'supplier'     => 'supplier',
            'agency_types' => 'agencyTypes',
        ];

        foreach ($fields as $field => $category) {
            $value = trim($tender->$field ?? '');
            if ($value !== '') {
                // Perform a case-insensitive existence check to prevent duplicate labels
                $exists = \App\Models\MasterListItem::where('category', $category)
                    ->whereRaw('LOWER(label) = ?', [strtolower($value)])
                    ->exists();

                if (!$exists) {
                    \App\Models\MasterListItem::create([
                        'category'   => $category,
                        'label'      => $value,
                        'color'      => null,
                        'text_color' => null,
                    ]);
                }
            }
        }
    }

    // Overriding the workflow actions for Tender
    public function requestVerification(Request $request, $id) {
        $model = $this->getModel($id);
        $model->verification_status = 'pending_supervisor'; // Pending Check
        if ($request->has('signature')) {
            $model->creator_signature = $request->input('signature');
        }
        $model->save();

        $type = 'Tender';
        $code = $model->project_code ?? 'N/A';
        $name = $model->project_title ?? '';
        $message = "[Tender] Checking requested for $code" . ($name ? " ($name)" : "") . " by " . $request->user()->name;
        $url = '/businesses/tenders';

        // Notify Project Managers (business_admin)
        $notifiables = \App\Models\User::whereIn('role', ['business_admin'])->get();
        \Illuminate\Support\Facades\Notification::send($notifiables, new \App\Notifications\VerificationRequested([
            'message' => $message,
            'url' => $url,
            'id' => $model->id,
            'type' => $type
        ]));

        return response()->json($model->load(['creator:id,name', 'checker:id,name', 'verifier:id,name', 'approver:id,name']));
    }

    // Step 2: Checked by Project Manager (business_admin) -> transitions to pending_verify
    public function check(Request $request, $id) {
        if (in_array($request->user()->role, ['superadmin', 'admin'])) {
            return response()->json(['message' => 'Directors cannot check tenders.'], 403);
        }

        $model = $this->getModel($id);
        $model->verification_status = 'pending_verify'; // Pending Verification
        $model->checked_by = $request->user()->id;
        $model->checked_at = now();
        if ($request->has('signature')) {
            $model->checker_signature = $request->input('signature');
        }
        $model->save();

        $type = 'Tender';
        $code = $model->project_code ?? 'N/A';
        $message = "[Tender] Checked by Project Manager. Pending verification from General Manager.";
        $url = '/businesses/tenders';

        // Notify General Managers (business_higher_admin)
        $gms = \App\Models\User::whereIn('role', ['business_higher_admin'])->get();
        \Illuminate\Support\Facades\Notification::send($gms, new \App\Notifications\VerificationRequested([
            'message' => $message,
            'url' => $url,
            'id' => $model->id,
            'type' => $type
        ]));

        return response()->json($model->load(['creator:id,name', 'checker:id,name', 'verifier:id,name', 'approver:id,name']));
    }

    // Step 3: Verified by General Manager (business_higher_admin) -> transitions to pending_superadmin (Pending Approval)
    public function verify(Request $request, $id) {
        if (in_array($request->user()->role, ['superadmin', 'admin'])) {
            return response()->json(['message' => 'Directors cannot verify tenders.'], 403);
        }

        $model = $this->getModel($id);
        $model->verification_status = 'pending_superadmin'; // Pending Approval
        $model->verified_by = $request->user()->id;
        $model->verified_at = now();
        if ($request->has('signature')) {
            $model->verifier_signature = $request->input('signature');
        }
        $model->save();

        $type = 'Tender';
        $code = $model->project_code ?? 'N/A';
        $message = "[Tender] Verified by General Manager. Pending final approval from Director.";
        $url = '/businesses/tenders';

        // Notify Directors (superadmin / admin)
        $directors = \App\Models\User::whereIn('role', ['superadmin', 'admin'])->get();
        \Illuminate\Support\Facades\Notification::send($directors, new \App\Notifications\VerificationRequested([
            'message' => $message,
            'url' => $url,
            'id' => $model->id,
            'type' => $type
        ]));

        return response()->json($model->load(['creator:id,name', 'checker:id,name', 'verifier:id,name', 'approver:id,name']));
    }

    // Step 4: Approved by Director (superadmin / admin) -> transitions to approved
    public function approve(Request $request, $id) {
        if (!in_array($request->user()->role, ['superadmin', 'admin'])) {
            return response()->json(['message' => 'Only Directors can approve tenders.'], 403);
        }

        $model = $this->getModel($id);
        $model->verification_status = 'approved';
        $model->approved_by = $request->user()->id;
        $model->approved_at = now();
        if ($request->has('signature')) {
            $model->approver_signature = $request->input('signature');
        }
        $model->status = 'Completed';
        $model->save();

        $type = 'Tender';
        $code = $model->project_code ?? 'N/A';
        $message = "[Tender] Request for $code has been fully approved by Director.";
        $url = '/businesses/tenders';

        if ($model->created_by) {
            $creator = \App\Models\User::find($model->created_by);
            if ($creator) {
                $creator->notify(new \App\Notifications\VerificationRequested([
                    'message' => $message,
                    'url' => $url,
                    'id' => $model->id,
                    'type' => $type
                ]));
            }
        }

        return response()->json($model->load(['creator:id,name', 'checker:id,name', 'verifier:id,name', 'approver:id,name']));
    }
}
