<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ServiceReport;
use App\Models\ReportPhoto;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ServiceReportController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceReport::with(['photos', 'incidentReport', 'inspectionReport']);
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'company_name' => 'nullable|string',
            'address' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'telephone_no' => 'nullable|string',
            'taken_by' => 'nullable|string',
            'date_time' => 'required|date',
            'service_types' => 'required|array',
            'service_type_others_text' => 'nullable|string',
            'description' => 'nullable|string',
            'service_summary' => 'required|array', // JSON list of steps
            'summary_date' => 'nullable|date',
            'summary_time' => 'nullable|string',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:10240',
            'linked_incident_report_id' => 'nullable|exists:incident_reports,id',
            'linked_inspection_report_id' => 'nullable|exists:inspection_reports,id',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Generate SR NO: R109/2026 — use MAX to avoid gaps/duplicates from deletions
            $year = date('Y', strtotime($validated['date_time']));
            $suffix = "/{$year}";

            // Find the highest sequence number already used for this year
            $lastNo = ServiceReport::where('service_report_no', 'like', 'R%' . $suffix)
                
                ->orderBy('service_report_no', 'desc')
                ->value('service_report_no'); // e.g. "R003/2026"

            $nextSeq = 1;
            if ($lastNo) {
                // Extract the numeric part from e.g. "R003/2026" → 3
                $numPart = substr($lastNo, 1, strpos($lastNo, '/') - 1);
                $nextSeq = ((int) $numPart) + 1;
            }

            $validated['service_report_no'] = 'R' . str_pad($nextSeq, 3, '0', STR_PAD_LEFT) . $suffix;

            $serviceReport = ServiceReport::create($validated);

            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $index => $photo) {
                    $path = $photo->store('reports/service', 'public');
                    $serviceReport->photos()->create([
                        'photo_path' => $path,
                        'caption' => $request->input("photo_remarks.{$index}")
                    ]);
                }
            }

            return response()->json($serviceReport->load(['photos', 'incidentReport', 'inspectionReport']), 201);
        });
    }

    public function show($id)
    {
        return response()->json(ServiceReport::with(['photos', 'incidentReport', 'inspectionReport'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $serviceReport = ServiceReport::findOrFail($id);
        $validated = $request->validate([
            'company_name' => 'nullable|string',
            'address' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'telephone_no' => 'nullable|string',
            'taken_by' => 'nullable|string',
            'date_time' => 'sometimes|required|date',
            'service_types' => 'sometimes|required|array',
            'service_type_others_text' => 'nullable|string',
            'description' => 'nullable|string',
            'service_summary' => 'sometimes|required|array',
            'summary_date' => 'nullable|date',
            'summary_time' => 'nullable|string',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:10240',
            'linked_incident_report_id' => 'nullable|exists:incident_reports,id',
            'linked_inspection_report_id' => 'nullable|exists:inspection_reports,id',
        ]);

        return DB::transaction(function () use ($serviceReport, $validated, $request) {
            $serviceReport->update($validated);

            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $index => $photo) {
                    $path = $photo->store('reports/service', 'public');
                    $serviceReport->photos()->create([
                        'photo_path' => $path,
                        'caption' => $request->input("photo_remarks.{$index}")
                    ]);
                }
            }

            return response()->json($serviceReport->load(['photos', 'incidentReport', 'inspectionReport']));
        });
    }

    public function destroy($id)
    {
        $serviceReport = ServiceReport::findOrFail($id);
        foreach ($serviceReport->photos as $photo) {
            Storage::disk('public')->delete($photo->photo_path);
            $photo->delete();
        }
        $serviceReport->delete();
        return response()->json(['message' => 'Service report deleted']);
    }

    public function deletePhoto($reportId, $photoId)
    {
        $photo = ReportPhoto::where('reportable_id', $reportId)
            ->where('reportable_type', ServiceReport::class)
            ->findOrFail($photoId);
        
        Storage::disk('public')->delete($photo->photo_path);
        $photo->delete();
        
        return response()->json(['message' => 'Photo deleted']);
    }
}
