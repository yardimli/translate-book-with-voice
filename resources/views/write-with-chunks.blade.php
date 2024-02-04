<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<meta name="csrf-token" content="{{ csrf_token() }}">
	<meta name="app_url" content="{{env('APP_URL')}}">
	<title>Write With Voice</title>
	
	{{--  jQuery, popper.js, and Bootstrap JS  --}}
	<script src="{{ asset('assets/js/jquery-3.6.0.min.js') }}"></script>
	<script src="{{ asset('assets/js/popper.min.js') }}"></script>
	<script src="{{ asset('assets/js/bootstrap.min.js') }}"></script>
	
	{{--  Bootstrap CSS  --}}
	<link href="{{ asset('assets/css/bootstrap.min.css') }}" rel="stylesheet">
	
	<!-- Chess JS (slightly modified) -->
	<script src="{{ asset('voice/opus/OpusMediaRecorder.umd.js') }}"></script>
	<script src="{{ asset('voice/opus/encoderWorker.umd.js') }}"></script>
	<script src="{{ asset('voice/js/opus-recorder-with-chunks.js') }}"></script>
	
	
	{{--  Custom JS  --}}
	<script src="{{ asset('js/test.js') }}"></script>
	
	<style>
      .custom-tooltip {
          --bs-tooltip-bg: var(--bs-primary);
      }
	</style>

</head>
<body>



<div style="width: 100vw; max-width: 1280px; margin:0 auto; height: 100vh; overflow: hidden;">
	<div class="row">
		<div class="col-6">
			<div class="mb-1 mt-1">
				<div id="recognitionHistory" class="container border border-primary overflow-auto mb-2"
				     style="position:relative; height: 75px; max-height: 75px;">
					<div id="startHint"
					     style="position:absolute; top: 14px; left:10px; font-weight: bold; font-size:30px; text-align: center;">
						Başlamak icin Tıkla!
					</div>
				</div>
				
				
				<div class="progress mb-2">
					<div class="progress-bar bg-primary progress-bar-striped progress-bar-animated"
					     role="progressbar" aria-valuenow="0" style="width: 0%"
					     aria-valuemin="0" aria-valuemax="10" id='SendWaitProgressBar'>
					</div>
				</div>
				
				<button class="btn btn-primary" id="startRecordingButton">Kayda Başla</button>
				<button class="btn btn-primary" id="langBtn">Türkçe</button>
			</div>
			
			<textarea class="form-control" id="textareaInput" rows="10" placeholder="Enter text here..."
			          style="height: calc(100vh - 170px); resize: none;"></textarea>
		</div>
		<div class="col-6">
			<div class="docx-content" id="docx-content"
			     style="height: calc(100vh - 40px); overflow: auto; margin-top:20px; padding-right:20px; margin-bottom: 20px;">
				{!! $text !!}
			</div>
		</div>
	</div>
</div>


</body>
</html>
