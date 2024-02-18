<?php

	use App\Http\Controllers\DocxViewController;
	use App\Http\Controllers\HomeController;
	use App\Http\Controllers\VoiceController;
	use Illuminate\Support\Facades\Route;

	/*
	|--------------------------------------------------------------------------
	| Web Routes
	|--------------------------------------------------------------------------
	|
	| Here is where you can register web routes for your application. These
	| routes are loaded by the RouteServiceProvider and all of them will
	| be assigned to the "web" middleware group. Make something great!
	|
	*/

	Route::get('/', function () {
		return view('choose-device');
	});

	Auth::routes();

	Route::get('/home', [HomeController::class, 'index'])->name('home');

	Route::get('/bootstrap-jquery-test', function () {
		return view('bootstrap-jquery-test');
	});


	Route::get('/write', [DocxViewController::class, 'show'])->name('page.write');
	Route::post('/save-audio', [VoiceController::class, 'save_audio'])->name('save-audio');
	Route::post('/save-text', [VoiceController::class, 'saveText'])->name('save-text');
	Route::get('/get-text/{paragraphNumber}', [VoiceController::class, 'getText'])->name('get-text');
	Route::get('/export-text', [VoiceController::class, 'exportText']);

	Route::get('/ipad-write', [DocxViewController::class, 'ipad_show'])->name('page.ipad-write');
	Route::get('/find-last-paragraph-with-text', [VoiceController::class, 'find_last_paragraph_with_text'])->name('find-last-paragraph-with-text');
	Route::post('/undo-text', [VoiceController::class, 'undoText']);
	Route::get('/generate-text', [DocxViewController::class, 'generateTextRequest'])->name('generate-text');



	Route::get('/write-with-chunks', [DocxViewController::class, 'show'])->name('page.write-with-chunks');

	Route::post('/save-audio-with-chunks', [VoiceController::class, 'save_audio_with_chunks'])->name('save-audio-with-chunks');
	Route::post('/save-audio-long-with-chunks', [VoiceController::class, 'save_audio_long_with_chunks'])->name('save-audio-long-with-chunks');

