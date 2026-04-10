<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IncidentReport;
use App\Models\ReportPhoto;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class IncidentReportController extends Controller
{
    public function index(Request $request)
    {
        $query = IncidentReport::with(['photos', 'linkedServiceReport']);
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        return response()->json($query->orderBy('report_date', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'reported_by' => 'required|string',
            'report_date' => 'required|date',
            'role_of_recorded' => 'nullable|string',
            'incident_types' => 'required|array',
            'incident_type_others_text' => 'nullable|string',
            'affected_equipment' => 'nullable|string',
            'incident_location' => 'nullable|string',
            'finding_date' => 'nullable|date',
            'incident_scenario' => 'nullable|string',
            'incident_description' => 'nullable|string',
            'specifications' => 'nullable|string',
            'inability' => 'nullable|string',
            'impact' => 'nullable|string',
            'operation' => 'nullable|string',
            'recommendations' => 'nullable|string',
            'replacement_capability' => 'nullable|string',
            'remarks' => 'nullable|string',
            'verified_by' => 'nullable|string',
            'verified_designation' => 'nullable|string',
            'verified_date' => 'nullable|date',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:10240', // 10MB per photo
            'linked_service_report_id' => 'nullable|exists:service_reports,id',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Lock the table to prevent duplicate IR numbers under concurrent requests
            $year = date('Y', strtotime($validated['report_date']));
            $prefix = "KMSB/IR/{$year}/";

            // Find the highest sequence number already used for this year
            $lastNo = IncidentReport::where('ir_no', 'like', $prefix . '%')
                
                ->orderBy('ir_no', 'desc')
                ->value('ir_no'); // e.g. "KMSB/IR/2026/0003"

            $nextSeq = 1;
            if ($lastNo) {
                $lastSeq = (int) substr($lastNo, strlen($prefix));
                $nextSeq = $lastSeq + 1;
            }

            $validated['ir_no'] = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

            $incident = IncidentReport::create($validated);

            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $index => $photo) {
                    $path = $photo->store('reports/incident', 'public');
                    $incident->photos()->create([
                        'photo_path' => $path,
                        'caption' => $request->input("photo_remarks.{$index}")
                    ]);
                }
            }

            return response()->json($incident->load(['photos', 'linkedServiceReport']), 201);
        });
    }

    public function show($id)
    {
        return response()->json(IncidentReport::with(['photos', 'linkedServiceReport'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $incident = IncidentReport::findOrFail($id);
        $validated = $request->validate([
            'reported_by' => 'sometimes|required|string',
            'report_date' => 'sometimes|required|date',
            'role_of_recorded' => 'nullable|string',
            'incident_types' => 'sometimes|required|array',
            'incident_type_others_text' => 'nullable|string',
            'affected_equipment' => 'nullable|string',
            'incident_location' => 'nullable|string',
            'finding_date' => 'nullable|date',
            'incident_scenario' => 'nullable|string',
            'incident_description' => 'nullable|string',
            'specifications' => 'nullable|string',
            'inability' => 'nullable|string',
            'impact' => 'nullable|string',
            'operation' => 'nullable|string',
            'recommendations' => 'nullable|string',
            'replacement_capability' => 'nullable|string',
            'remarks' => 'nullable|string',
            'verified_by' => 'nullable|string',
            'verified_designation' => 'nullable|string',
            'verified_date' => 'nullable|date',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:10240',
            'linked_service_report_id' => 'nullable|exists:service_reports,id',
        ]);

        return DB::transaction(function () use ($incident, $validated, $request) {
            $incident->update($validated);

            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $index => $photo) {
                    $path = $photo->store('reports/incident', 'public');
                    $incident->photos()->create([
                        'photo_path' => $path,
                        'caption' => $request->input("photo_remarks.{$index}")
                    ]);
                }
            }

            return response()->json($incident->load(['photos', 'linkedServiceReport']));
        });
    }

    public function destroy($id)
    {
        $incident = IncidentReport::findOrFail($id);
        foreach ($incident->photos as $photo) {
            Storage::disk('public')->delete($photo->photo_path);
            $photo->delete();
        }
        $incident->delete();
        return response()->json(['message' => 'Incident report deleted']);
    }

    public function deletePhoto($reportId, $photoId)
    {
        $photo = ReportPhoto::where('reportable_id', $reportId)
            ->where('reportable_type', IncidentReport::class)
            ->findOrFail($photoId);
        
        Storage::disk('public')->delete($photo->photo_path);
        $photo->delete();
        
        return response()->json(['message' => 'Photo deleted']);
    }
}
