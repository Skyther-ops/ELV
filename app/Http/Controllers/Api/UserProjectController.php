<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProject;
use App\Models\Building;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserProjectController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $roles = (array) ($user->role ?? []);

        if (in_array('admin', $roles) || in_array('superadmin', $roles) || in_array('supervisor', $roles)) {
            // Admins, Superadmins, and Supervisors see EVERYTHING.
            $projects = UserProject::with('building')->get();
        } else {
            // Filter based on specific roles
            $projects = UserProject::with('building')
                ->where(function($q) use ($roles) {
                    // Facilitators see SSDC projects
                    if (in_array('facilitator', $roles)) {
                        $q->orWhere('is_facilitator_only', true);
                    }
                    // Members see standard projects
                    if (in_array('member', $roles) || empty($roles)) {
                        $q->orWhere('is_facilitator_only', false);
                    }
                })
                ->get();
        }

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $request->validate([
            'building_id' => 'required|exists:buildings,id',
            'name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'location' => 'nullable|string|max:255',
            'is_facilitator_only' => 'nullable|boolean'
        ]);

        $user = Auth::user();
        $roles = (array) ($user->role ?? []);

        $canCreate = in_array('admin', $roles) || in_array('superadmin', $roles) || in_array('supervisor', $roles) || in_array('facilitator', $roles);
        
        if (!$canCreate) {
            return response()->json(['message' => 'Your account role is not authorized to create projects.'], 403);
        }

        // Duplicate the building so this project has a "fresh" slate
        $blueprint = Building::with(['floors.zones'])->findOrFail($request->building_id);
        
        $newBuilding = $blueprint->replicate();
        $newBuilding->name = $request->name; // name it after the project
        if ($request->has('latitude')) $newBuilding->latitude = $request->latitude;
        if ($request->has('longitude')) $newBuilding->longitude = $request->longitude;
        $newBuilding->is_blueprint = false;
        $newBuilding->save();

        foreach ($blueprint->floors as $floor) {
            $newFloor = $floor->replicate();
            $newFloor->building_id = $newBuilding->id;
            $newFloor->category_maps = null; // Clean slate for uploads
            $newFloor->save();

            // Duplicate the preset zones if they exist in the blueprint
            foreach ($floor->zones as $zone) {
                $newZone = $zone->replicate();
                $newZone->floor_id = $newFloor->id;
                $newZone->save();
            }
        }
        
        $project = UserProject::create([
            'user_id' => $user->id,
            'building_id' => $newBuilding->id,
            'name' => $request->name,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'location' => $request->location,
            'is_facilitator_only' => $request->is_facilitator_only ?? false,
            'started_at' => now()
        ]);

        return response()->json($project->load('building'), 201);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $roles = (array) ($user->role ?? []);

        if (in_array('member', $roles)) {
            return response()->json(['message' => 'Members are not allowed to remove projects.'], 403);
        }

        $project = UserProject::where('user_id', $user->id)->where('id', $id)->firstOrFail();
        
        $buildingId = $project->building_id;
        $project->delete();

        // Ensure we only delete buildings that are NOT blueprints (just in case)
        $building = Building::find($buildingId);
        if ($building && !$building->is_blueprint) {
            $building->delete();
            // In a real app we'd also trigger cascade deletes of Floors/Zones/Annotations,
            // or rely on DB foreign key constraints (ON DELETE CASCADE).
        }

        return response()->json(['message' => 'Project removed from your list']);
    }
}
