$(document).ready(function () {
	console.log('jQuery works!');
	console.log(bootstrap.Tooltip.VERSION);
	
	//enable tooltip
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
	const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

});

setTimeout(function () {
	$("#exampleModal").modal('show');
}, 13000);

