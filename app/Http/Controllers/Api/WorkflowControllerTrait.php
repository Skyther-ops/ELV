<?php
namespace App\Http\Controllers\Api;
use App\Models\User;
use App\Notifications\VerificationRequested;
use Illuminate\Http\Request;

trait WorkflowControllerTrait {
    public function requestVerification(Request $request, $id) {
        $model = $this->getModel($id);
        $model->verification_status = 'pending_supervisor';
        $model->save();

        $type = (new \ReflectionClass($model))->getShortName();
        $code = $model->project_code ?? 'N/A';
        $name = $model->project_title ?? $model->product_name ?? '';
        $message = "[$type] Verification requested for $code" . ($name ? " ($name)" : "") . " by " . $request->user()->name;
        $url = $type === 'Tender' ? '/businesses/tenders' : '/businesses/license-tracking';

        $notifiables = User::whereIn('role', ['supervisor', 'superadmin'])->get();
        \Illuminate\Support\Facades\Notification::send($notifiables, new VerificationRequested([
            'message' => $message,
            'url' => $url,
            'id' => $model->id,
            'type' => $type
        ]));

        return response()->json($model);
    }

    public function verify(Request $request, $id) {
        $model = $this->getModel($id);
        $model->verification_status = 'pending_superadmin';
        $model->verified_by = $request->user()->id;
        $model->verified_at = now();
        if ($request->has('signature')) {
            $model->verifier_signature = $request->input('signature');
        }
        $model->save();

        $type = (new \ReflectionClass($model))->getShortName();
        $code = $model->project_code ?? 'N/A';
        $message = "[$type] Verification approved for $code. Pending final approval from Super Admin.";
        $url = $type === 'Tender' ? '/businesses/tenders' : '/businesses/license-tracking';

        $superadmins = User::where('role', 'superadmin')->get();
        \Illuminate\Support\Facades\Notification::send($superadmins, new VerificationRequested([
            'message' => $message,
            'url' => $url,
            'id' => $model->id,
            'type' => $type
        ]));

        return response()->json($model);
    }

    public function approve(Request $request, $id) {
        $model = $this->getModel($id);
        $model->verification_status = 'approved';
        $model->approved_by = $request->user()->id;
        $model->approved_at = now();
        if ($request->has('signature')) {
            $model->approver_signature = $request->input('signature');
        }
        if (method_exists($model, 'markAsComplete')) {
            $model->markAsComplete();
        } else {
            // Generic fallback
            $model->status = 'Completed';
            
            // Only set 'completed' if the column actually exists in the database
            $table = $model->getTable();
            if (\Illuminate\Support\Facades\Schema::hasColumn($table, 'completed')) {
                $model->completed = true;
            }
        }
        $model->save();

        // Notify the creator and Super Admins that it has been approved
        $type = (new \ReflectionClass($model))->getShortName();
        $code = $model->project_code ?? 'N/A';
        $message = "[$type] Request for $code has been fully approved.";
        $url = $type === 'Tender' ? '/businesses/tenders' : '/businesses/license-tracking';

        if ($model->created_by) {
            $creator = User::find($model->created_by);
            if ($creator) {
                $creator->notify(new VerificationRequested([
                    'message' => $message,
                    'url' => $url,
                    'id' => $model->id,
                    'type' => $type
                ]));
            }
        }

        $superadmins = User::where('role', 'superadmin')->get();
        \Illuminate\Support\Facades\Notification::send($superadmins, new VerificationRequested([
            'message' => $message,
            'url' => $url,
            'id' => $model->id,
            'type' => $type
        ]));

        return response()->json($model);
    }
}
