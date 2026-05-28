<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterListItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MasterListController extends Controller
{
    private const VALID_CATEGORIES = ['status', 'type', 'agencyTypes', 'company', 'customer', 'supplier', 'project_document_title', 'quotationVersion'];

    /** GET /master-list  — returns all items grouped by category */
    public function index(): JsonResponse
    {
        $items = MasterListItem::orderBy('sort_order')->orderBy('id')->get();

        $grouped = collect(self::VALID_CATEGORIES)->mapWithKeys(fn($cat) => [
            $cat => $items->where('category', $cat)->values(),
        ]);

        return response()->json($grouped);
    }

    /** POST /master-list */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category'   => ['required', 'in:' . implode(',', self::VALID_CATEGORIES)],
            'label'      => ['required', 'string', 'max:255'],
            'color'      => ['nullable', 'string', 'max:20'],
            'text_color' => ['nullable', 'string', 'max:20'],
            'email'      => ['nullable', 'email', 'max:255'],
            'contact1'   => ['nullable', 'string', 'max:50'],
            'contact2'   => ['nullable', 'string', 'max:50'],
            'contact3'   => ['nullable', 'string', 'max:50'],
            'items_supplied' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'pic_name'   => ['nullable', 'string', 'max:255'],
            'pic_phone'  => ['nullable', 'string', 'max:50'],
            'pic_email'  => ['nullable', 'email', 'max:255'],
        ]);

        $item = MasterListItem::create($data);
        return response()->json($item, 201);
    }

    /** PUT /master-list/{id} */
    public function update(Request $request, int $id): JsonResponse
    {
        $item = MasterListItem::findOrFail($id);

        $data = $request->validate([
            'label'      => ['sometimes', 'required', 'string', 'max:255'],
            'color'      => ['nullable', 'string', 'max:20'],
            'text_color' => ['nullable', 'string', 'max:20'],
            'email'      => ['nullable', 'email', 'max:255'],
            'contact1'   => ['nullable', 'string', 'max:50'],
            'contact2'   => ['nullable', 'string', 'max:50'],
            'contact3'   => ['nullable', 'string', 'max:50'],
            'items_supplied' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'pic_name'   => ['nullable', 'string', 'max:255'],
            'pic_phone'  => ['nullable', 'string', 'max:50'],
            'pic_email'  => ['nullable', 'email', 'max:255'],
        ]);

        $item->update($data);
        return response()->json($item);
    }

    /** DELETE /master-list/{id} */
    public function destroy(int $id): JsonResponse
    {
        MasterListItem::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    /** POST /master-list/seed — restores a category to defaults */
    public function seed(Request $request): JsonResponse
    {
        $request->validate(['category' => ['required', 'in:' . implode(',', self::VALID_CATEGORIES)]]);
        $category = $request->category;

        MasterListItem::where('category', $category)->delete();

        $seeds = $this->getSeedData()[$category] ?? [];
        foreach ($seeds as $i => $seed) {
            MasterListItem::create(array_merge($seed, ['category' => $category, 'sort_order' => $i]));
        }

        return response()->json(['message' => "Category '{$category}' reset to defaults."]);
    }

    private function getSeedData(): array
    {
        return [
            'status' => [
                ['label' => 'COMPLETED',      'color' => '#16a34a', 'text_color' => '#fff'],
                ['label' => 'NOT PARTICIPATE','color' => '#6b7280', 'text_color' => '#fff'],
                ['label' => 'UNSUCCESSFUL',   'color' => '#dc2626', 'text_color' => '#fff'],
                ['label' => 'AWARDED',        'color' => '#991b1b', 'text_color' => '#fff'],
                ['label' => 'PENDING RESULT', 'color' => '#d97706', 'text_color' => '#fff'],
                ['label' => 'PREPARING',      'color' => '#78350f', 'text_color' => '#fff'],
                ['label' => 'BUDGETARY',      'color' => '#374151', 'text_color' => '#fff'],
                ['label' => 'RETENDER',       'color' => '#0f766e', 'text_color' => '#fff'],
            ],
            'type' => [
                ['label' => 'RFQ',          'color' => '#3b82f6', 'text_color' => '#fff'],
                ['label' => 'TENDER',       'color' => '#22c55e', 'text_color' => '#fff'],
                ['label' => 'RFQ - FR',     'color' => '#a78bfa', 'text_color' => '#fff'],
                ['label' => 'RFQ - BDGT',   'color' => '#f9a8d4', 'text_color' => '#831843'],
                ['label' => 'RFQ - INTERNAL'],
            ],
            'agencyTypes' => [
                ['label' => 'Corporate GLC',      'color' => '#1e293b', 'text_color' => '#fff'],
                ['label' => 'Federal Government', 'color' => '#166534', 'text_color' => '#fff'],
                ['label' => 'State Government',   'color' => '#15803d', 'text_color' => '#fff'],
                ['label' => 'Private Company',    'color' => '#c2410c', 'text_color' => '#fff'],
                ['label' => 'Entreprise'],
            ],
            'company' => [
                ['label' => 'EA', 'color' => '#0d9488', 'text_color' => '#fff'],
                ['label' => 'TP', 'color' => '#16a34a', 'text_color' => '#fff'],
                ['label' => 'KM', 'color' => '#7c3aed', 'text_color' => '#fff'],
            ],
            'customer' => [
                ['label' => 'JPKN',                            'color' => '#1e40af', 'text_color' => '#fff'],
                ['label' => 'AMC',                             'color' => '#1d4ed8', 'text_color' => '#fff'],
                ['label' => 'CSE Telematics'],
                ['label' => 'Globinaco'],
                ['label' => 'Grandis Hotel',                   'color' => '#ef4444', 'text_color' => '#fff'],
                ['label' => 'KKTP',                            'color' => '#f59e0b', 'text_color' => '#fff'],
                ['label' => 'Lembaga Sukan Sabah'],
                ['label' => 'SESB',                            'color' => '#7c3aed', 'text_color' => '#fff'],
                ['label' => 'SabahPorts'],
                ['label' => 'JHEINS',                          'color' => '#f59e0b', 'text_color' => '#fff'],
                ['label' => 'Sawit Kinabalu',                  'color' => '#15803d', 'text_color' => '#fff'],
                ['label' => 'Grandis Peninsula Sdn Bhd',       'color' => '#dc2626', 'text_color' => '#fff'],
                ['label' => 'DIDR'],
                ['label' => 'Graceworth'],
                ['label' => 'JPVS'],
                ['label' => 'Universiti Malaysia Sabah',       'color' => '#dc2626', 'text_color' => '#fff'],
                ['label' => 'Jabatan Pembangunan Masyarakat'],
                ['label' => 'Jabatan Kerja Raya',              'color' => '#dc2626', 'text_color' => '#fff'],
                ['label' => 'Petronas',                        'color' => '#111827', 'text_color' => '#fff'],
                ['label' => 'Jabatan Pengaliran dan Saliran'],
                ['label' => 'Jabatan Bendahari Negeri Sabah'],
                ['label' => 'Wijaya Daya',                     'color' => '#16a34a', 'text_color' => '#fff'],
                ['label' => 'Celcom Timur'],
                ['label' => 'Sabah Energy Corporation (SEC)',  'color' => '#f97316', 'text_color' => '#fff'],
            ],
            'supplier' => [
                ['label' => 'Example Supplier', 'items_supplied' => 'Cables, Connectors', 'color' => '#0d9488', 'text_color' => '#fff'],
            ],
            'quotationVersion' => [
                ['label' => '01 - Original Proposal', 'color' => '#3b82f6', 'text_color' => '#fff'],
                ['label' => '02 - Revised Pricing', 'color' => '#22c55e', 'text_color' => '#fff'],
                ['label' => '03 - Final Negotiations', 'color' => '#ef4444', 'text_color' => '#fff'],
            ],
        ];
    }
}
