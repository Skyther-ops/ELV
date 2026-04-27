<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\Api\UserProjectController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\ZoneObjectController;
use App\Http\Controllers\Api\ZoneController;
use App\Http\Controllers\Api\FloorAnnotationController;
use App\Http\Controllers\Api\LegendController;
use App\Http\Controllers\Api\PendingHistoryController;
use App\Http\Controllers\Api\RiserController;
use App\Http\Controllers\Api\TechnicalLayoutController;

Route::post('/register', [AuthController::class , 'register']);
Route::post('/login', [AuthController::class , 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class , 'me']);
    
    // User management routes
    Route::get('/users', [\App\Http\Controllers\Api\UserController::class, 'index']);
    Route::post('/users', [\App\Http\Controllers\Api\UserController::class, 'store']);
    Route::put('/users/{id}', [\App\Http\Controllers\Api\UserController::class, 'update']);
    Route::delete('/users/{id}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);

    // CORS Fix for images
    Route::get('/storage/{path}', function ($path) {
        $fullPath = storage_path('app/public/' . $path);
        if (!file_exists($fullPath)) abort(404);
        return response()->file($fullPath, ['Access-Control-Allow-Origin' => '*']);
    })->where('path', '.*');

    Route::get('/online-users', [AuthController::class , 'onlineUsers']);

    // Chat routes
    Route::get('/messages', [\App\Http\Controllers\ChatController::class, 'index']);
    Route::post('/messages', [\App\Http\Controllers\ChatController::class, 'store']);
    Route::get('/chat/users', [\App\Http\Controllers\ChatController::class, 'getUsers']);
    
    // Profile routes
    Route::put('/profile/update', [\App\Http\Controllers\Api\ProfileController::class, 'updateProfile']);
    Route::post('/profile/upload-photo', [\App\Http\Controllers\Api\ProfileController::class, 'uploadPhoto']);
    
    // Projects API (Global)
    Route::get('/projects', [\App\Http\Controllers\ProjectController::class , 'index']);
    Route::post('/projects', [\App\Http\Controllers\ProjectController::class , 'store']);
    Route::put('/projects/{id}', [\App\Http\Controllers\ProjectController::class , 'update']);
    Route::delete('/projects/{id}', [\App\Http\Controllers\ProjectController::class , 'destroy']);

    // User Project Map Pins
    Route::get('/user-projects', [UserProjectController::class, 'index']);
    Route::post('/user-projects', [UserProjectController::class, 'store']);
    Route::delete('/user-projects/{id}', [UserProjectController::class, 'destroy']);

    // ── Business Module: Tenders ──────────────────────────────────────
    Route::get('/tenders', [\App\Http\Controllers\Api\TenderController::class, 'index']);
    Route::get('/tenders/{id}', [\App\Http\Controllers\Api\TenderController::class, 'show']);
    Route::post('/tenders', [\App\Http\Controllers\Api\TenderController::class, 'store']);
    Route::put('/tenders/{id}', [\App\Http\Controllers\Api\TenderController::class, 'update']);
    Route::delete('/tenders/{id}', [\App\Http\Controllers\Api\TenderController::class, 'destroy']);

    Route::get('/tenders/{tenderId}/costing-items', [\App\Http\Controllers\Api\TenderCostingItemController::class, 'index']);
    Route::post('/tenders/{tenderId}/costing-items', [\App\Http\Controllers\Api\TenderCostingItemController::class, 'store']);
    Route::put('/tenders/{tenderId}/costing-items/{id}', [\App\Http\Controllers\Api\TenderCostingItemController::class, 'update']);
    Route::delete('/tenders/{tenderId}/costing-items/{id}', [\App\Http\Controllers\Api\TenderCostingItemController::class, 'destroy']);

    // ── Business Module: Master List ──────────────────────────────────
    Route::get('/master-list', [\App\Http\Controllers\Api\MasterListController::class, 'index']);
    Route::post('/master-list', [\App\Http\Controllers\Api\MasterListController::class, 'store']);
    Route::put('/master-list/{id}', [\App\Http\Controllers\Api\MasterListController::class, 'update']);
    Route::delete('/master-list/{id}', [\App\Http\Controllers\Api\MasterListController::class, 'destroy']);
    Route::post('/master-list/seed', [\App\Http\Controllers\Api\MasterListController::class, 'seed']);

    // Project-Scoped Routes (Require X-Project-Id header)
    Route::middleware('project.scope')->group(function () {
        // Inventory Routes
        Route::get('/inventory', [InventoryController::class , 'index']);
        Route::post('/inventory', [InventoryController::class , 'store']);
        Route::put('/inventory/{id}', [InventoryController::class , 'update']);
        Route::delete('/inventory/{id}', [InventoryController::class , 'destroy']);
        Route::post('/inventory/stock-in', [InventoryController::class , 'stockIn']);
        Route::post('/inventory/stock-out', [InventoryController::class , 'stockOut']);
        Route::get('/inventory/history', [InventoryController::class, 'history']);
        Route::post('/inventory/return-tool', [InventoryController::class , 'returnTool']);

        // Building Progress Routes
        Route::get('/buildings', [BuildingController::class , 'index']);
        Route::get('/buildings/{id}', [BuildingController::class , 'show']);
        Route::post('/buildings/{id}/image', [BuildingController::class, 'uploadElevationImage']); // Fixed name
        Route::get('/floors/{id}', [BuildingController::class , 'showFloor']);
        Route::post('/buildings/{id}/floors', [BuildingController::class, 'storeFloor']); // Added missing route
        Route::post('/floors/{id}/image', [BuildingController::class , 'uploadFloorImage']); // Fixed name
        Route::put('/floors/{id}/path', [BuildingController::class, 'updateFloorPath']);
        Route::delete('/floors/{id}', [BuildingController::class, 'deleteFloor']); // Added missing route
        Route::get('/dashboard', [BuildingController::class, 'dashboard']);
        Route::get('/boq', [BuildingController::class, 'getBoq']);

        // Zone Management
        Route::get('/floors/{floorId}/zones', [ZoneController::class, 'index']);
        Route::post('/floors/{floorId}/zones', [ZoneController::class, 'store']); // Fixed parameter
        Route::put('/zones/{id}', [ZoneController::class, 'update']);
        Route::delete('/zones/{id}', [ZoneController::class, 'destroy']);

        // Object Management (System Components)
        Route::get('/objects/all', [\App\Http\Controllers\Api\ObjectComponentController::class, 'all']);
        Route::get('/objects', [\App\Http\Controllers\Api\ObjectComponentController::class, 'index']);
        Route::post('/objects', [\App\Http\Controllers\Api\ObjectComponentController::class, 'store']);
        Route::patch('/objects/{id}', [\App\Http\Controllers\Api\ObjectComponentController::class, 'update']);
        Route::delete('/objects/{id}', [\App\Http\Controllers\Api\ObjectComponentController::class, 'destroy']);
        Route::post('/objects/{id}/status', [\App\Http\Controllers\Api\ObjectComponentController::class, 'updateStatus']);
        
        // Port management
        Route::post('/objects/{id}/ports', [\App\Http\Controllers\Api\ObjectComponentController::class, 'addPort']);
        Route::patch('/objects/{id}/ports/{portId}/link', [\App\Http\Controllers\Api\ObjectComponentController::class, 'establishLink']);
        Route::put('/objects/{id}/ports/{portId}', [\App\Http\Controllers\Api\ObjectComponentController::class, 'updatePort']);
        Route::delete('/objects/{id}/ports/{portId}', [\App\Http\Controllers\Api\ObjectComponentController::class, 'deletePort']);

        // Zone-specific Objects (Legacy path support if needed)
        Route::get('/zones/{zoneId}/objects', [\App\Http\Controllers\Api\ObjectComponentController::class, 'index']);
        Route::post('/zones/{zoneId}/objects', [\App\Http\Controllers\Api\ObjectComponentController::class, 'store']);

        // Annotations & Legends
        Route::get('/legends', [LegendController::class, 'index']);
        Route::post('/legends', [LegendController::class, 'store']);
        Route::delete('/legends/{id}', [LegendController::class, 'destroy']);
        Route::get('/annotations', [FloorAnnotationController::class, 'index']);
        Route::get('/floors/{floorId}/annotations', [FloorAnnotationController::class, 'index']);
        Route::post('/floors/{floorId}/annotations', [FloorAnnotationController::class, 'store']);
        Route::post('/annotations/{id}', [FloorAnnotationController::class, 'update']);
        Route::delete('/annotations/{id}', [FloorAnnotationController::class, 'destroy']);
        Route::delete('/floors/{floorId}/annotations', [FloorAnnotationController::class, 'bulkDestroy']);

        // BOQ CSV Uploads
        Route::get('/boq-csv', [\App\Http\Controllers\Api\BoqCsvController::class, 'index']);
        Route::post('/boq-csv', [\App\Http\Controllers\Api\BoqCsvController::class, 'store']);
        Route::patch('/boq-csv/items/{id}', [\App\Http\Controllers\Api\BoqCsvController::class, 'updateItemStatus']);

        // Audit Logs
        Route::get('/pending-histories', [PendingHistoryController::class, 'index']);

        // Safety Dashboard
        Route::apiResource('safety-documents', \App\Http\Controllers\Api\SafetyDocumentController::class)->except(['show', 'update']);
        Route::apiResource('safety-agendas', \App\Http\Controllers\Api\SafetyAgendaController::class)->except(['show', 'update']);
        Route::apiResource('safety-ppes', \App\Http\Controllers\Api\SafetyPpeController::class)->except(['show']);
        Route::apiResource('safety-notifications', \App\Http\Controllers\Api\SafetyNotificationController::class)->except(['show', 'update']);

        // Floor Drawing Revisions
        Route::apiResource('floor-drawing-revisions', \App\Http\Controllers\Api\FloorDrawingRevisionController::class);

        // Onsite Reports Dashboard
        Route::apiResource('onsite-reports', \App\Http\Controllers\Api\OnsiteReportController::class)->only(['index', 'store', 'update', 'destroy']);
        
        // Master BOQ
        Route::get('/boq/summary', [\App\Http\Controllers\Api\BoqController::class, 'getSummary']);
        Route::get('/boq/cables', [\App\Http\Controllers\Api\BoqController::class, 'getCableTopology']);
        Route::post('/boq/upload-master', [\App\Http\Controllers\Api\BoqItemController::class, 'uploadMaster']);
        Route::delete('/boq-master', [\App\Http\Controllers\Api\BoqItemController::class, 'clearMaster']);
        Route::get('/boq-items', [\App\Http\Controllers\Api\BoqItemController::class, 'index']);

        // Cable & Port Management
        Route::get('/annotations/{id}/ports', [\App\Http\Controllers\Api\CablePortController::class, 'index']);
        Route::post('/annotations/{id}/ports', [\App\Http\Controllers\Api\CablePortController::class, 'store']);
        Route::patch('/ports/{portId}', [\App\Http\Controllers\Api\CablePortController::class, 'update']);
        Route::delete('/ports/{portId}', [\App\Http\Controllers\Api\CablePortController::class, 'destroy']);
        Route::post('/ports/connect', [\App\Http\Controllers\Api\CablePortController::class, 'connect']);
        Route::patch('/connections/{connectionId}', [\App\Http\Controllers\Api\CablePortController::class, 'updateConnection']);
        Route::delete('/connections/{connectionId}', [\App\Http\Controllers\Api\CablePortController::class, 'disconnect']);
        Route::get('/cables/suggest', [\App\Http\Controllers\Api\CablePortController::class, 'suggestCableId']);
        Route::get('/cables/{cableId}', [\App\Http\Controllers\Api\CablePortController::class, 'showCable']);
        Route::get('/floors/{floorId}/cables', [\App\Http\Controllers\Api\CablePortController::class, 'cablesByFloor']);
        
        // Risers
        Route::get('/floors/{floorId}/risers', [RiserController::class, 'index']);
        Route::post('/risers', [RiserController::class, 'store']);
        Route::post('/risers/{id}/initialize', [RiserController::class, 'initializeRacks']);

        // Attendance Records
        Route::apiResource('attendance', \App\Http\Controllers\Api\AttendanceController::class);
        Route::post('/attendance/personal-remark', [\App\Http\Controllers\Api\AttendanceController::class, 'upsertPersonalRemark']);

        // Scheduling
        Route::apiResource('schedules', \App\Http\Controllers\Api\ScheduleController::class);

        // Technical Layouts
        Route::get('/technical-layouts', [TechnicalLayoutController::class, 'index']);
        Route::post('/technical-layouts', [TechnicalLayoutController::class, 'store']);
        Route::post('/technical-layouts/{id}', [TechnicalLayoutController::class, 'update']);
        Route::put('/technical-layouts/{id}/zones', [TechnicalLayoutController::class, 'updateZones']);
        Route::delete('/technical-layouts/{id}', [TechnicalLayoutController::class, 'destroy']);
        
        // Technical Layout Zone Details
        Route::post('/technical-layout-zones/{id}/objects', [TechnicalLayoutController::class, 'addZoneObject']);
        Route::delete('/technical-layout-zone-objects/{id}', [TechnicalLayoutController::class, 'deleteZoneObject']);
        Route::post('/technical-layout-zones/{id}/annotations', [TechnicalLayoutController::class, 'addZoneAnnotation']);
        Route::delete('/technical-layout-zone-annotations/{id}', [TechnicalLayoutController::class, 'deleteZoneAnnotation']);
        Route::patch('/technical-layout-zones/{id}/status', [TechnicalLayoutController::class, 'updateZoneStatus']);
        Route::delete('/technical-layout-zones/{id}', [TechnicalLayoutController::class, 'deleteZone']);

        // Technical Layout Widgets (Environmental Sensors)
        Route::apiResource('technical-layout-widgets', \App\Http\Controllers\Api\TechnicalLayoutWidgetController::class);

        // Facilitator Modules
        Route::apiResource('ssdc-passwords', \App\Http\Controllers\Api\SsdcPasswordController::class);
        Route::apiResource('maintenance-tasks', \App\Http\Controllers\Api\MaintenanceTaskController::class);
        Route::apiResource('incident-reports', \App\Http\Controllers\Api\IncidentReportController::class);
        Route::apiResource('inspection-reports', \App\Http\Controllers\Api\InspectionReportController::class);
        Route::apiResource('equipment-checksheets', \App\Http\Controllers\Api\EquipmentChecksheetController::class);
        Route::apiResource('daily-checklists', \App\Http\Controllers\Api\DailyChecklistController::class);
        Route::apiResource('maintenance-reports', \App\Http\Controllers\Api\MaintenanceReportController::class);
        Route::apiResource('service-reports', \App\Http\Controllers\Api\ServiceReportController::class);
        Route::apiResource('pdu-checklists', \App\Http\Controllers\Api\PduChecklistController::class);
        Route::apiResource('risk-assessments', \App\Http\Controllers\RiskAssessmentController::class);
        
        // Custom Report Routes
        Route::delete('incident-reports/{reportId}/photos/{photoId}', [\App\Http\Controllers\Api\IncidentReportController::class, 'deletePhoto']);
        Route::delete('service-reports/{reportId}/photos/{photoId}', [\App\Http\Controllers\Api\ServiceReportController::class, 'deletePhoto']);
    });
});
