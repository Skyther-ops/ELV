<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Building;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    /**
     * Display a listing of all available projects.
     * All authenticated users can view all projects.
     */
    public function index()
    {
        $projects = Project::with(['buildings' => function($query) {
            $query->withoutGlobalScopes();
        }])->orderBy('name')->get();
        return response()->json($projects);
    }

    /**
     * Store a newly created project in storage.
     * Only supervisors should be able to do this.
     */
    public function store(Request $request)
    {
        if ($request->user()->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized. Only supervisors can create projects.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:projects',
            'description' => 'nullable|string',
            'type' => 'nullable|in:ssdc,construction',
            'building.name' => 'nullable|string|max:255',
            'building.total_floor' => 'nullable|integer|min:1',
            'building.latitude' => 'nullable|string',
            'building.longitude' => 'nullable|string',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'] ?? 'construction',
        ]);

        $building = null;
        if ($request->has('building.name') && $request->has('building.latitude') && $request->has('building.longitude')) {
            $building = Building::create([
                'project_id' => $project->id,
                'name' => $validated['building']['name'],
                'total_floor' => $validated['building']['total_floor'] ?? 1,
                'latitude' => $validated['building']['latitude'],
                'longitude' => $validated['building']['longitude'],
            ]);
        }

        return response()->json([
            'message' => 'Project created successfully',
            'data' => $project,
            'building' => $building
        ], 201);
    }

    /**
     * Update the specified project in storage.
     * Only supervisors should be able to do this.
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized. Only supervisors can update projects.'], 403);
        }

        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:projects,name,' . $project->id,
            'description' => 'nullable|string',
        ]);

        $project->update($validated);

        return response()->json([
            'message' => 'Project updated successfully',
            'data' => $project
        ]);
    }

    /**
     * Remove the specified project from storage.
     * Only supervisors should be able to do this.
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized. Only supervisors can delete projects.'], 403);
        }

        $project = Project::findOrFail($id);

        // When a project is deleted, its cascaded items (buildings, inventory) 
        // should also be deleted. Ensure foreign keys have ON DELETE CASCADE or handle manually.
        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully'
        ]);
    }
}