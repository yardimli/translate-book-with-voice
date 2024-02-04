<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>jQuery, popper.js, and Bootstrap</title>
	
	{{--  jQuery, popper.js, and Bootstrap JS  --}}
	<script src="{{ asset('assets/js/jquery-3.6.0.min.js') }}"></script>
	<script src="{{ asset('assets/js/popper.min.js') }}"></script>
	<script src="{{ asset('assets/js/bootstrap.min.js') }}"></script>

	{{--  Bootstrap CSS  --}}
	<link href="{{ asset('assets/css/bootstrap.min.css') }}" rel="stylesheet">
	
	<script src="{{ asset('js/test.js') }}"></script>

	<style>
      .custom-tooltip {
          --bs-tooltip-bg: var(--bs-primary);
      }
	</style>
	
</head>
<body>

{{--  Test Bootstrap css  --}}
<div class="alert alert-success mt-5" role="alert">
	Boostrap 5 is working using laravel 8 mix!
</div>

<button type="button" class="btn btn-secondary"
        data-bs-toggle="tooltip" data-bs-placement="top"
        data-bs-custom-class="custom-tooltip"
        data-bs-title="This top tooltip is themed via CSS variables.">
	Custom tooltip
</button>

<!-- bootstrap modal -->
<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
	Launch demo modal
</button>

<div class="modal" tabindex="-1" id="exampleModal">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Modal title</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<p>Modal body text goes here.</p>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
				<button type="button" class="btn btn-primary">Save changes</button>
			</div>
		</div>
	</div>
</div>

</body>
</html>
