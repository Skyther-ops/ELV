<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TechnicalLayoutWidget;
use Illuminate\Http\Request;

class TechnicalLayoutWidgetController extends Controller
{
    public function index(Request $request)
    {
        $query = TechnicalLayoutWidget::query();
        if ($request->has('technical_layout_id')) {
            $query->where('technical_layout_id', $request->technical_layout_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'technical_layout_id' => 'required|exists:technical_layouts,id',
            'technical_layout_zone_id' => 'nullable|exists:technical_layout_zones,id',
            'type' => 'required|string',
            'color_theme' => 'required|string',
            'x_pos' => 'required|numeric',
            'y_pos' => 'required|numeric',
            'status' => 'nullable|string',
            'metadata' => 'nullable|array'
        ]);

        $widget = TechnicalLayoutWidget::create($validated);
        return response()->json($widget, 201);
    }

    public function show($id)
    {
        $widget = TechnicalLayoutWidget::findOrFail($id);
        return response()->json($widget);
    }

    public function update(Request $request, $id)
    {
        $widget = TechnicalLayoutWidget::findOrFail($id);
        
        $validated = $request->validate([
            'technical_layout_zone_id' => 'sometimes|nullable|exists:technical_layout_zones,id',
            'type' => 'sometimes|required|string',
            'color_theme' => 'sometimes|required|string',
            'x_pos' => 'sometimes|required|numeric',
            'y_pos' => 'sometimes|required|numeric',
            'status' => 'sometimes|nullable|string',
            'metadata' => 'nullable|array'
        ]);

        $widget->update($validated);
        return response()->json($widget);
    }

    public function destroy($id)
    {
        $widget = TechnicalLayoutWidget::findOrFail($id);
        $widget->delete();
        return response()->json(['message' => 'Widget deleted']);
    }
}
