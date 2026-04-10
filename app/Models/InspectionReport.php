<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionReport extends Model
{
    protected $fillable = [
        'project_id',
        'assigned_to_user_id',
        'created_by_user_id',
        'title',
        'rfwi_ref_no',
        'location',
        'gridline_zone',
        'date_inspected',
        'consultant_comments',
        'description',
        'file_path',
        'status',
        'inspection_date',
        'linked_service_report_id',
    ];

    public function assignedToUser()
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function linkedServiceReport()
    {
        return $this->belongsTo(ServiceReport::class, 'linked_service_report_id');
    }

    protected static function booted()
    {
        static::saved(function ($model) {
            if ($model->isDirty('linked_service_report_id')) {
                $originalId = $model->getOriginal('linked_service_report_id');
                if ($originalId) {
                    ServiceReport::where('id', $originalId)->update(['linked_inspection_report_id' => null]);
                }
                if ($model->linked_service_report_id) {
                    ServiceReport::where('id', $model->linked_service_report_id)->update(['linked_inspection_report_id' => $model->id]);
                }
            }
        });

        static::deleted(function ($model) {
            if ($model->linked_service_report_id) {
                ServiceReport::where('id', $model->linked_service_report_id)->update(['linked_inspection_report_id' => null]);
            }
        });
    }
}
