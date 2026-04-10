<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'project.scope' => \App\Http\Middleware\ProjectScopeMiddleware::class,
        ]);
        $middleware->appendToGroup('api', \App\Http\Middleware\UpdateUserLastSeen::class);
        $middleware->appendToGroup('api', \App\Http\Middleware\CheckBlocked::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // For API routes, always return a clean 401 JSON instead of
        // trying to redirect to a named 'login' route (which doesn't exist).
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();