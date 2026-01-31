<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\ProcessController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::post('/upload', [UploadController::class, 'store'])->name('upload');
Route::post('/process', [ProcessController::class, 'store'])->name('process');
