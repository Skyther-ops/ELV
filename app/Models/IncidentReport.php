<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncidentReport extends Model
{
    protected $fillable = [
        'project_id', 'ir_no', 'reported_by', 'report_date', 'role_of_recorded',
        'incident_types', 'incident_type_others_text', 'affected_equipment',
        'incident_location', 'finding_date', 'incident_scenario',
        'incident_description', 'specifications', 'inability', 'impact',
        'operation', 'recommendations', 'replacement_capability', 'remarks',
        'verified_by', 'verified_designation', 'verified_date',
        'linked_service_report_id'
    ];

    protected $casts = [
        'report_date' => 'date',
        'finding_date' => 'date',
        'verified_date' => 'date',
        'incident_types' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(UserProject::class, 'project_id');
    }

    public function photos()
    {
        return $this->morphMany(ReportPhoto::class, 'reportable');
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
                    ServiceReport::where('id', $originalId)->update(['linked_incident_report_id' => null]);
                }
                if ($model->linked_service_report_id) {
                    ServiceReport::where('id', $model->linked_service_report_id)->update(['linked_incident_report_id' => $model->id]);
                }
            }
        });

        static::deleted(function ($model) {
            if ($model->linked_service_report_id) {
                ServiceReport::where('id', $model->linked_service_report_id)->update(['linked_incident_report_id' => null]);
            }
        });
    }
}
