<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', fn () => response()->file(public_path('app/index.html')))
    ->where('any', '(?!api/|up$).*');