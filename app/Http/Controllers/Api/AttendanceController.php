<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Attendance;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $projectId = $request->query('project_id');
        $userId    = $request->query('user_id'); // Optional: filter by user
        $month     = $request->query('month');   // Optional: YYYY-MM

        $query = Attendance::with('user');

        if ($projectId) {
            $query->where('project_id', $projectId);
        }
        if ($userId) {
            $query->where('user_id', $userId);
        }
        if ($month) {
            $query->whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [$month]);
        }

        return response()->json($query->orderBy('date')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'        => 'required',
            'project_id'     => 'required|integer',
            'date'           => 'required|date',
            'status'         => 'required|string',
            'remarks'        => 'nullable|string',
            'personal_remark'=> 'nullable|string',
            'assigned_by'    => 'nullable|string',
            'assigned_by_name'=> 'nullable|string',
        ]);

        $attendance = Attendance::create($validated);
        return response()->json($attendance->load('user'), 201);
    }

    public function show(Attendance $attendance)
    {
        return response()->json($attendance->load('user'));
    }

    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'user_id'        => 'sometimes|string',
            'project_id'     => 'sometimes|integer',
            'date'           => 'sometimes|date',
            'status'         => 'sometimes|string',
            'remarks'        => 'nullable|string',
            'personal_remark'=> 'nullable|string',
            'assigned_by'    => 'nullable|string',
            'assigned_by_name'=> 'nullable|string',
        ]);

        $attendance->update($validated);
        return response()->json($attendance->load('user'));
    }

    /**
     * Facilitator self-service: upsert a personal remark on a specific date.
     * Does NOT require a shift status — purely for personal notes.
     */
    public function upsertPersonalRemark(Request $request)
    {
        $validated = $request->validate([
            'user_id'         => 'required|string',
            'project_id'      => 'required|integer',
            'date'            => 'required|date',
            'personal_remark' => 'nullable|string',
        ]);

        // Find existing record for this user+date, or create a shell one
        $record = Attendance::firstOrNew([
            'user_id'    => $validated['user_id'],
            'project_id' => $validated['project_id'],
            'date'       => $validated['date'],
        ]);

        if (!$record->exists) {
            $record->status = 'Note'; // Placeholder status for remark-only entries
        }

        $record->personal_remark = $validated['personal_remark'];
        $record->save();

        return response()->json($record->load('user'), 201);
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();
        return response()->json(null, 204);
    }
}
