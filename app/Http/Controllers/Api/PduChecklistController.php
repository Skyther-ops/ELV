<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PduChecklist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PduChecklistController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $request->validate(['project_id' => 'required|exists:projects,id']);
        return PduChecklist::where('project_id', $request->project_id)->orderByDesc('id')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'record_date' => 'required|date',
            'units_data' => 'nullable|array',
            'meta_data' => 'nullable|array'
        ]);

        $year = date('Y', strtotime($validated['record_date']));
        $prefix = "PDU/{$year}/";

        DB::beginTransaction();
        try {
            $lastRef = PduChecklist::where('pdu_ref_no', 'like', "{$prefix}%")
                ->orderByDesc('pdu_ref_no')
                ->value('pdu_ref_no');

            $number = 1;
            if ($lastRef) {
                $lastNumber = (int) substr($lastRef, strlen($prefix));
                $number = $lastNumber + 1;
            }

            $validated['pdu_ref_no'] = $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);

            $checklist = PduChecklist::create($validated);
            DB::commit();

            return response()->json($checklist, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to generate PDU Reference Number'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return PduChecklist::findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $checklist = PduChecklist::findOrFail($id);

        $validated = $request->validate([
            'record_date' => 'required|date',
            'units_data' => 'nullable|array',
            'meta_data' => 'nullable|array'
        ]);

        $checklist->update($validated);
        return response()->json($checklist);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $checklist = PduChecklist::findOrFail($id);
        $checklist->delete();

        return response()->noContent();
    }
}
