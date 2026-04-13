<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = ['name', 'description', 'type'];

    public function buildings()
    {
        return $this->hasMany(Building::class);
    }

    public function boqCsvUploads()
    {
        return $this->hasMany(BoqCsvUpload::class);
    }
}