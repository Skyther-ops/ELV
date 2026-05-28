<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenderCostingItem;
use App\Models\Tender;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TenderCostingItemController extends Controller
{
    public function index(Request $request, int $tenderId): JsonResponse
    {
        $items = TenderCostingItem::where('tender_id', $tenderId)->get();
        return response()->json($items);
    }

    public function store(Request $request, int $tenderId): JsonResponse
    {
        $data = $request->validate([
            'item_name'  => 'required|string',
            'details'    => 'nullable|string',
            'quotation_breakdown' => 'nullable|string',
            'supplier'   => 'nullable|string|max:255',
            'quantity'   => 'required|numeric|min:0',
            'unit_cost'  => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'has_sst'    => 'nullable|boolean',
            'has_costing_sst' => 'nullable|boolean',
        ]);

        $data['tender_id'] = $tenderId;
        $item = TenderCostingItem::create($data);

        $this->updateTenderTotals($tenderId);

        return response()->json($item, 201);
    }

    public function update(Request $request, int $tenderId, int $id): JsonResponse
    {
        $item = TenderCostingItem::where('tender_id', $tenderId)->findOrFail($id);

        $data = $request->validate([
            'item_name'  => 'required|string',
            'details'    => 'nullable|string',
            'quotation_breakdown' => 'nullable|string',
            'supplier'   => 'nullable|string|max:255',
            'quantity'   => 'required|numeric|min:0',
            'unit_cost'  => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'has_sst'    => 'nullable|boolean',
            'has_costing_sst' => 'nullable|boolean',
        ]);

        $item->update($data);

        $this->updateTenderTotals($tenderId);

        return response()->json($item);
    }

    public function destroy(int $tenderId, int $id): JsonResponse
    {
        $item = TenderCostingItem::where('tender_id', $tenderId)->findOrFail($id);
        $item->delete();

        $this->updateTenderTotals($tenderId);

        return response()->json(['message' => 'Deleted']);
    }

    private function updateTenderTotals(int $tenderId): void
    {
        $items = TenderCostingItem::where('tender_id', $tenderId)->get();
        $totalCost = 0;
        $totalSales = 0;

        foreach ($items as $item) {
            $totalCost += ($item->unit_cost * $item->quantity);
            $totalSales += ($item->unit_price * $item->quantity);
        }

        $margin = $totalSales - $totalCost;

        Tender::where('id', $tenderId)->update([
            'sales_price' => $totalSales,
            'cost_price' => $totalCost,
            'margin' => $margin,
        ]);
    }
}
