<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\License;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Api\WorkflowControllerTrait;

class LicenseController extends Controller
{
    use WorkflowControllerTrait;

    protected function getModel($id) {
        return License::findOrFail($id);
    }

    /** GET /licenses */
    public function index(): JsonResponse
    {
        $licenses = License::with(['tender:id,project_code,company', 'creator:id,name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($licenses);
    }

    /** GET /licenses/{id} */
    public function show(int $id): JsonResponse
    {
        $license = License::with(['tender:id,project_code,company', 'creator:id,name'])->findOrFail($id);
        return response()->json($license);
    }

    /** POST /licenses */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tender_id'       => ['nullable', 'integer', 'exists:tenders,id'],
            'company'         => ['nullable', 'string', 'max:100'],
            'project_code'    => ['nullable', 'string', 'max:100'],
            'do_no'           => ['nullable', 'string', 'max:100'],
            'quotation_no'    => ['nullable', 'string', 'max:255'],
            'client_name'     => ['nullable', 'string', 'max:255'],
            'product_name'    => ['nullable', 'string', 'max:500'],
            'serial_no'       => ['nullable', 'string', 'max:255'],
            'start_date'      => ['nullable', 'date'],
            'expiry_date'     => ['nullable', 'date'],
            'validity_period' => ['nullable', 'string', 'max:100'],
        ]);

        $data['created_by'] = $request->user()->id;
        $license = License::create($data);

        return response()->json($license->load(['tender:id,project_code,company', 'creator:id,name']), 201);
    }

    /** PUT /licenses/{id} */
    public function update(Request $request, int $id): JsonResponse
    {
        $license = License::findOrFail($id);

        $data = $request->validate([
            'tender_id'       => ['nullable', 'integer', 'exists:tenders,id'],
            'company'         => ['nullable', 'string', 'max:100'],
            'project_code'    => ['nullable', 'string', 'max:100'],
            'do_no'           => ['nullable', 'string', 'max:100'],
            'quotation_no'    => ['nullable', 'string', 'max:255'],
            'client_name'     => ['nullable', 'string', 'max:255'],
            'product_name'    => ['nullable', 'string', 'max:500'],
            'serial_no'       => ['nullable', 'string', 'max:255'],
            'start_date'      => ['nullable', 'date'],
            'expiry_date'     => ['nullable', 'date'],
            'validity_period' => ['nullable', 'string', 'max:100'],
            'acknowledged'    => ['nullable', 'boolean'],
        ]);

        $license->update($data);

        return response()->json($license->load(['tender:id,project_code,company', 'creator:id,name']));
    }

    /** POST /licenses/{id}/acknowledge */
    public function acknowledge(int $id): JsonResponse
    {
        $license = License::findOrFail($id);
        $license->update([
            'acknowledged'     => true,
            'last_notified_at' => now(),
        ]);

        return response()->json($license->load(['tender:id,project_code,company', 'creator:id,name']));
    }
    /** POST /licenses/{id}/complete */
    public function complete(int $id): JsonResponse
    {
        $license = License::findOrFail($id);
        $license->update([
            'completed'    => true,
            'completed_at' => now(),
            'acknowledged' => true,
        ]);

        return response()->json($license->load(['tender:id,project_code,company', 'creator:id,name']));
    }

    /** DELETE /licenses/{id} */
    public function destroy(int $id): JsonResponse
    {
        License::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
