let currentEditingParagraph = 1;

function scrollToPA(number) {
	// The container with overflow auto
	var $container = $('#docx-content');
	
	// Remove background color from all PA paragraphs
	$container.find('div[data-pa-number]').css('background-color', '');
	
	// Find the specific PA paragraph within the container
	var $pa = $container.find('div[data-pa-number="' + number + '"]');
	
	// Check if the paragraph exists
	if ($pa.length) {
		// Change background color to yellow
		$pa.css('background-color', 'yellow');
		currentEditingParagraph = parseInt(number);
		$("#writing-paragraph-hint").text("Etkin Paragraf: " + currentEditingParagraph);
		
		// Calculate the position to scroll to
		// It's the offset of the paragraph relative to the container top minus the container's current scrollTop
		// This might need adjustment based on your exact layout and requirements
		var scrollToPosition = $pa.position().top + $container.scrollTop() - $container.position().top - 100;
		
		// Scroll to the paragraph within the container
		$container.animate({
			scrollTop: scrollToPosition
		}, 500); // Adjust the duration (500ms here) as needed
	} else {
		console.error('PA #' + number + ' not found.');
	}
}

function autoSave() {
	let text = $("#textareaInput").val();
	
	if (text === lastSavedText) {
		console.log('No changes to save');
		return;
	}
	
	if (text === '') {
		console.log('No text to save');
		return;
	}
	
	$("#saveBtn").text("Saklaniyor...");
	
	// Prepare the data to be sent
	let data = {
		paragraph_number: currentEditingParagraph,
		paragraph_text: text,
		_token: $('meta[name="csrf-token"]').attr('content') // Include CSRF token
	};
	
	$.ajax({
		url: '/save-text',
		type: 'POST',
		data: data,
		success: function (response) {
			console.log('Auto-saved successfully');
			lastSavedText = text;
			$("#saveBtn").text("Sakla");
			// Optionally update the UI to inform the user of the save
		},
		error: function (xhr, status, error) {
			console.error('Error auto-saving:', error);
			$("#saveBtn").text("Sakla");
			$("#recognitionHistory").prepend(`<span>Auto-save failed.</span><br>`);
			$("#recognitionHistory").prepend(`<span>${error}</span><br>`);
		}
	});
}

function loadParagraphData(paragraphNumber) {
	$.ajax({
		url: '/get-text/' + paragraphNumber,
		type: 'GET',
		success: function (response) {
			if (response.error) {
				$("#textareaInput").val('');
			} else if (response.paragraph_text) {
				$("#textareaInput").val(response.paragraph_text);
				lastSavedText = response.paragraph_text;
			}
		},
		error: function (xhr, status, error) {
			console.error('Error loading data:', error);
		}
	});
	
	var paragraphNumberInt = parseInt(paragraphNumber);
	if (paragraphNumberInt > 1) {
		
		$.ajax({
			url: '/get-text/' + (paragraphNumberInt - 1),
			type: 'GET',
			success: function (response) {
				if (response.error) {
					$("#prevParagraphText").html('');
				} else if (response.paragraph_text) {
					let prevText = response.paragraph_text;
					prevText = prevText.replace(/\n/g, '<br>');
					$("#prevParagraphText").html(prevText);
					//scroll to bottom of the div
					$("#prevParagraphText").scrollTop($("#prevParagraphText")[0].scrollHeight);
				}
			},
			error: function (xhr, status, error) {
				console.error('Error loading data:', error);
			}
		});
	} else {
		$("#prevParagraphText").html('');
	}
	
}

function exportText() {
	window.open('/export-text', '_blank');
}

function loadLastParagraphWithText() {
	$.ajax({
		url: '/find-last-paragraph-with-text',
		type: 'GET',
		success: function (response) {
			if (response.error) {
				console.error('Error finding last paragraph with text:', response.error);
			} else if (response.paragraph_number) {
				currentEditingParagraph = response.paragraph_number;
				
				scrollToPA(currentEditingParagraph);
				$("#textareaInput").val('');
				loadParagraphData(currentEditingParagraph);
			}
		},
		error: function (xhr, status, error) {
			console.error('Error finding last paragraph with text:', error);
		}
	});
}


$(document).ready(function () {
	console.log('jQuery works!');
	console.log(bootstrap.Tooltip.VERSION);
	
	//enable tooltip
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
	const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
	
	
	setTimeout(function () {
		scrollToPA(1);
		$("#textareaInput").val('');
		loadLastParagraphWithText();
	}, 500);
	
	
	$("#saveBtn").on('click', function () {
		autoSave();
	});
	
	
	$(".book-text").on('click', function () {
		let paragraphNumber = $(this).data('pa-number');
		scrollToPA(paragraphNumber);
		$("#textareaInput").val('');
		loadParagraphData(paragraphNumber);
	});
	
	$("#undoBtn").on('click', function () {
		let data = {
			paragraph_number: currentEditingParagraph,
			_token: $('meta[name="csrf-token"]').attr('content') // Include CSRF token
		};
		
		$.ajax({
			url: '/undo-text',
			type: 'POST',
			data: data,
			success: function (response) {
				if (response.success) {
					$("#textareaInput").val(response.paragraph_text ? response.paragraph_text : '');
					console.log('Undo successful');
					// Optionally, refresh the view or update UI elements
				} else {
					console.error('Undo failed:', response.message);
				}
			},
			error: function (xhr, status, error) {
				console.error('Error performing undo:', error);
			}
		});
	});
	
});
