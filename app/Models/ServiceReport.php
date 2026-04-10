<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceReport extends Model
{
    protected $fillable = [
        'project_id', 'service_report_no', 'company_name', 'address',
        'contact_person', 'telephone_no', 'taken_by', 'date_time',
        'service_types', 'service_type_others_text', 'description',
        'service_summary', 'summary_date', 'summary_time',
        'linked_incident_report_id', 'linked_inspection_report_id'
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'summary_date' => 'date',
        'service_types' => 'array',
        'service_summary' => 'array', // Use JSON for list of steps
    ];

    public function project()
    {
        return $this->belongsTo(UserProject::class, 'project_id');
    }

    public function photos()
    {
        return $this->morphMany(ReportPhoto::class, 'reportable');
    }

    public function incidentReport()
    {
        return $this->belongsTo(IncidentReport::class, 'linked_incident_report_id');
    }

    public function inspectionReport()
    {
        return $this->belongsTo(InspectionReport::class, 'linked_inspection_report_id');
    }

    protected static function booted()
    {
        static::saved(function ($model) {
            if ($model->isDirty('linked_incident_report_id')) {
                $originalId = $model->getOriginal('linked_incident_report_id');
                if ($originalId) {
                    IncidentReport::where('id', $originalId)->update(['linked_service_report_id' => null]);
                }
                if ($model->linked_incident_report_id) {
                    IncidentReport::where('id', $model->linked_incident_report_id)->update(['linked_service_report_id' => $model->id]);
                }
            }

            if ($model->isDirty('linked_inspection_report_id')) {
                $originalId = $model->getOriginal('linked_inspection_report_id');
                if ($originalId) {
                    InspectionReport::where('id', $originalId)->update(['linked_service_report_id' => null]);
                }
                if ($model->linked_inspection_report_id) {
                    InspectionReport::where('id', $model->linked_inspection_report_id)->update(['linked_service_report_id' => $model->id]);
                }
            }
        });

        static::deleted(function ($model) {
            if ($model->linked_incident_report_id) {
                IncidentReport::where('id', $model->linked_incident_report_id)->update(['linked_service_report_id' => null]);
            }
            if ($model->linked_inspection_report_id) {
                InspectionReport::where('id', $model->linked_inspection_report_id)->update(['linked_service_report_id' => null]);
            }
        });
    }
}
