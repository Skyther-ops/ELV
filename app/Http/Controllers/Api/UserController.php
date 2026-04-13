<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * List all users
     */
    public function index()
    {
        $users = User::all()->map(function ($user) {
            return $this->formatUser($user);
        });

        return response()->json($users);
    }

    /**
     * Store new user
     */
    public function store(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => ['required', 'string', Password::defaults()],
            'role' => 'required|in:member,supervisor,facilitator',
        ]);

        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'role' => $fields['role'],
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $this->formatUser($user)
        ], 201);
    }

    /**
     * Update user (Blocking toggle / role change)
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($request->has('isBlocked')) {
            $user->is_blocked = (bool) $request->isBlocked;
        }

        if ($request->has('role')) {
            $user->role = $request->role;
        }

        $user->save();

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $this->formatUser($user)
        ]);
    }

    /**
     * Delete user (Supervisor only)
     */
    public function destroy(Request $request, $id)
    {
        $requester = $request->user();
        if ($requester->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized. Only supervisors can delete users.'], 403);
        }

        if ((string) $requester->id === (string) $id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user = User::findOrFail($id);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Helper to format user for frontend
     */
    private function formatUser(User $user)
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'displayName' => $user->name,
            'email' => $user->email,
            'role' => [$user->role],
            'photoURL' => $user->photo_url ? asset($user->photo_url) : '',
            'isBlocked' => (bool) $user->is_blocked,
            'lastSeenAt' => $user->last_seen_at ? $user->last_seen_at->toIso8601String() : null,
        ];
    }
}
