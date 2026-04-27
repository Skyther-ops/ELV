<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterListItem extends Model
{
    protected $fillable = [
        'category', 'label', 'color', 'text_color',
        'email', 'contact1', 'contact2', 'contact3', 'items_supplied', 'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
