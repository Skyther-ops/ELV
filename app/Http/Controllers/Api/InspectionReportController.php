<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InspectionReport;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class InspectionReportController extends Controller
{
    public function index(Request $request)
    {
        $project_id = $request->header('X-Project-Id');
        
        $query = InspectionReport::with(['assignedToUser', 'createdBy', 'linkedServiceReport'])
            ->where('project_id', $project_id);

        if ($request->has('start_date')) {
            $query->whereDate('inspection_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('inspection_date', '<=', $request->end_date);
        }

        $reports = $query->latest()
            ->get();
            
        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $project_id = $request->header('X-Project-Id');
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'rfwi_ref_no' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'gridline_zone' => 'nullable|string|max:255',
            'date_inspected' => 'nullable|date',
            'consultant_comments' => 'nullable|string',
            'description' => 'nullable|string',
            'assigned_to_user_id' => 'required|exists:users,id',
            'inspection_date' => 'required|date',
            'status' => 'required|in:pending,approve,approve with comment,rejected,standby,completed,failed',
            'file' => 'required|file|mimes:pdf|max:10240', // Max 10MB
            'linked_service_report_id' => 'nullable|exists:service_reports,id',
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('inspections', 'public');
        }

        $report = InspectionReport::create([
            'project_id' => $project_id,
            'assigned_to_user_id' => $validated['assigned_to_user_id'],
            'created_by_user_id' => Auth::id(),
            'title' => $validated['title'],
            'rfwi_ref_no' => $validated['rfwi_ref_no'] ?? null,
            'location' => $validated['location'] ?? null,
            'gridline_zone' => $validated['gridline_zone'] ?? null,
            'date_inspected' => $validated['date_inspected'] ?? null,
            'consultant_comments' => $validated['consultant_comments'] ?? null,
            'description' => $validated['description'],
            'file_path' => $filePath,
            'status' => $validated['status'],
            'inspection_date' => $validated['inspection_date'],
            'linked_service_report_id' => $validated['linked_service_report_id'] ?? null,
        ]);

        return response()->json($report->load(['assignedToUser', 'createdBy', 'linkedServiceReport']), 201);
    }

    public function show(InspectionReport $inspectionReport)
    {
        return response()->json($inspectionReport->load(['assignedToUser', 'createdBy', 'project', 'linkedServiceReport']));
    }

    public function update(Request $request, InspectionReport $inspectionReport)
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'rfwi_ref_no' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'gridline_zone' => 'nullable|string|max:255',
            'date_inspected' => 'nullable|date',
            'consultant_comments' => 'nullable|string',
            'description' => 'nullable|string',
            'assigned_to_user_id' => 'exists:users,id',
            'inspection_date' => 'date',
            'status' => 'in:pending,approve,approve with comment,rejected,standby,completed,failed',
            'file' => 'nullable|file|mimes:pdf|max:10240',
            'linked_service_report_id' => 'nullable|exists:service_reports,id',
        ]);

        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($inspectionReport->file_path && Storage::disk('public')->exists($inspectionReport->file_path)) {
                Storage::disk('public')->delete($inspectionReport->file_path);
            }
            $validated['file_path'] = $request->file('file')->store('inspections', 'public');
        }

        $inspectionReport->update($validated);

        return response()->json($inspectionReport->load(['assignedToUser', 'createdBy', 'linkedServiceReport']));
    }

    public function destroy(InspectionReport $inspectionReport)
    {
        if ($inspectionReport->file_path && Storage::disk('public')->exists($inspectionReport->file_path)) {
            Storage::disk('public')->delete($inspectionReport->file_path);
        }
        
        $inspectionReport->delete();
        
        return response()->json(null, 204);
    }
}
