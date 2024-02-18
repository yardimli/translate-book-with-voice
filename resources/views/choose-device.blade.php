<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<meta name="csrf-token" content="{{ csrf_token() }}">
	<meta name="app_url" content="{{env('APP_URL')}}">
	<title>Ses ile Yazma</title>
	
	{{--  jQuery, popper.js, and Bootstrap JS  --}}
	<script src="{{ asset('assets/js/jquery-3.6.0.min.js') }}"></script>
	<script src="{{ asset('assets/js/popper.min.js') }}"></script>
	<script src="{{ asset('assets/js/bootstrap.min.js') }}"></script>
	
	{{--  Bootstrap CSS  --}}
	<link href="{{ asset('assets/css/bootstrap.min.css') }}" rel="stylesheet">

</head>
<body style="background-color: #ddd">

<div class="row m-4">
	<div class="col-sm-6">
		<div class="card shadow" style="height: 90vh; cursor: pointer;" id="desktop_mode">
			<div class="card-body">
				<h5 class="card-title" style="font-size: 50px;">Masaüstü</h5>
				<p class="card-text" style="font-size: 30px;">Konuşmayı metne dönüştürmek için sunucunun AI'sını kullanın.
				</p>
				<div style="text-align: center;">
				<img src="{{ asset('images/laptop.jpg') }}" alt="desktop" style="height: 40vh;">
				</div>
				<a href="/write" class="btn btn-lg btn-primary mt-2" style="font-size: 30px;">Başlamak için tıklayın
				</a>
			</div>
		</div>
	</div>
	<div class="col-sm-6">
		<div class="card shadow" style="height: 90vh; cursor: pointer;" id="ipad_mode">
			<div class="card-body">
				<h5 class="card-title" style="font-size: 50px;">iPad Yatay Mod
				</h5>
				<p class="card-text" style="font-size: 30px;">iPad'in sesli yazma özelliğini kullanın, otomatik kaydetme
					özelliklerinin ve yarı ekran düzeninin kullanın.</p>
				<div style="text-align: center;">
					<img src="{{ asset('images/ipad.jpg') }}" alt="desktop" style="height: 40vh;">
				</div>
				<a href="/ipad-write" class="btn btn-lg btn-primary mt-2" style="font-size: 30px;">Başlamak için tıklayın
				</a>
			</div>
		</div>
	</div>
</div>

<script>
	$('#desktop_mode').click(function () {
		window.location.href = '/write';
	});
	$('#ipad_mode').click(function () {
		window.location.href = '/ipad-write';
	});
</script>

</body>
</html>
