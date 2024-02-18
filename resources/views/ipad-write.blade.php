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
	<script>
		var website_url = "{{env('APP_URL')}}";
	</script>

	{{--  Custom JS  --}}
	<script src="{{ asset('js/ipad-write.js') }}"></script>
	
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
			
			<div style="min-height: 140px; max-height: 140px; height: 140px; border: 1px solid #aaa; border-radius: 6px; overflow: auto;" class="mt-2 p-2 " id="prevParagraphText">
			
			</div>
			
			<textarea class="form-control mt-2" id="textareaInput" rows="10" placeholder="Buraya metin girin..."
			          style="height: calc(100vh - 300px); resize: none;"></textarea>
			
			<div class="mb-1 mt-1">
				<button class="btn btn-primary" id="undoBtn">Geri Al</button>
				<button class="btn btn-primary" id="saveBtn">Sakla</button>
				<button class="btn btn-secondary" id="exportBtn" onclick="exportText()">Dışa Aktar</button>
				<span id="writing-paragraph-hint">Etkin Paragraf: 1</span>
				<span id="hint2"></span>
			</div>
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
