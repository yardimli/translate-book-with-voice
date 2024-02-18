let currentEditingParagraph = 1;
let disableAutoSave = false;
let lastSavedText = '';


function disableButtonsAndShowSpinner(button_id) {
	$('#' + button_id).prop('disabled', true);
	$('#' + button_id + '_spinner').css('display', 'inline-block');
	$('#' + button_id + '_spinner').show();
}

function enableButtonsAndHideSpinner(button_id) {
	$('#' + button_id).prop('disabled', false);
	$('#' + button_id + '_spinner').css('display', 'none');
	$('#' + button_id + '_spinner').hide();
}


function generateTextRequest(output_field_id, button_id, url_to_load) {
	disableButtonsAndShowSpinner(button_id);
	console.log('disable next button 1');
	disableButtonsAndShowSpinner('nextBtn');
	
	const eventSource = new EventSource(url_to_load);
	
	let inputField = document.getElementById(output_field_id);
	inputField.value = inputField.value + "\n";
	
	eventSource.onmessage = function (e) {
		//console.log(e.data);
		if (e.data === '[DONE]') {
			enableButtonsAndHideSpinner(button_id);
			eventSource.close();
			inputField.value = inputField.value.trim();
		} else {
			
			let data_json = JSON.parse(e.data);
			if (data_json.errors !== undefined) {
				// handle your errors here
				console.log(data_json.errors);
				
				let errors = data_json.errors;
				let errorMessages = '';
				for (let field in errors) {
					if (errors.hasOwnProperty(field)) {
						errorMessages += field + ': ' + errors[field].join(', ') + '\n';
					}
				}
				alert(errorMessages);
				
				enableButtonsAndHideSpinner(button_id);
				eventSource.close();
			} else if (data_json.status !== undefined && data_json.status === "[DONE]") {
				
				if (typeof data_json.chat_response !== 'undefined') {
					inputField.value += data_json.chat_response.replace(/(?:\r\n|\r|\n)/g, '<br>');
				}
				enableButtonsAndHideSpinner(button_id);
				eventSource.close();
				inputField.value = inputField.value.trim();
			} else {
				let txt = data_json.choices[0].delta.content;
				if (txt !== undefined) {
					inputField.value += txt; // txt.replace(/(?:\r\n|\r|\n)/g, ' ');
					inputField.scrollTop = inputField.scrollHeight;
				}
			}
		}
	};
	
	eventSource.onerror = function (e) {
		console.log(e);
		if (!generating_image) {
			console.log('enable next button 2');
			enableButtonsAndHideSpinner('nextBtn');
		}
		enableButtonsAndHideSpinner(button_id);
		// inputField.value = '';
		eventSource.close();
	};
	
	}


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
	if (disableAutoSave) {
		console.log('Auto-save is disabled');
		$("#hint2").text("Yukleme sürerken, otomatik kayıt devre dışı");
		setTimeout(function () {
			$("#hint2").text("");
		},1000);
		return;
	}
	
	let text = $("#textareaInput").val();
	
	if (text === lastSavedText) {
		console.log('No changes to save');
		$("#hint2").text("Değişiklik yok");
		return;
	}
	
	if (text === '') {
		console.log('No text to save');
		$("#hint2").text("Kaydedilecek metin yok");
		return;
	}
	
	$("#saveBtn").text("Saklanıyor...");
	
	// Prepare the data to be sent
	let data = {
		paragraph_number: currentEditingParagraph,
		paragraph_text: text,
		_token: $('meta[name="csrf-token"]').attr('content') // Include CSRF token
	};
	
	disableAutoSave = true;
	$.ajax({
		url: '/save-text',
		type: 'POST',
		data: data,
		success: function (response) {
			console.log('Auto-saved successfully');
			$("#hint2").text("Otomatik kaydedildi");
			lastSavedText = text;
			disableAutoSave = false;
			$("#saveBtn").text("Sakla");
			// Optionally update the UI to inform the user of the save
			
		},
		error: function (xhr, status, error) {
			console.error('Error auto-saving:', error);
			$("#saveBtn").text("Sakla");
			disableAutoSave = false;
			$("#hint2").html('auto save error: '+ error);
		}
	});
}

function loadParagraphData(paragraphNumber) {
	disableAutoSave = true;
	$.ajax({
		url: '/get-text/' + paragraphNumber,
		type: 'GET',
		success: function (response) {
			disableAutoSave = false;
			$("#translated_text_"+(paragraphNumberInt)).html('');
			if (response.error) {
				$("#textareaInput").val('');
			} else if (response.paragraph_text) {
				$("#textareaInput").val(response.paragraph_text);
				lastSavedText = response.paragraph_text;
			}
		},
		error: function (xhr, status, error) {
			disableAutoSave = false;
			console.error('Error loading data:', error);
			$("#hint2").html('load paragraph data error: '+ error);
		}
	});
	
	var paragraphNumberInt = parseInt(paragraphNumber);
	if (paragraphNumberInt > 1) {
		
		$.ajax({
			url: '/get-text/' + (paragraphNumberInt - 1),
			type: 'GET',
			success: function (response) {
				disableAutoSave = false;
				if (response.error) {
					$("#translated_text_"+(paragraphNumberInt - 1)).html('');
				} else if (response.paragraph_text) {
					let prevText = response.paragraph_text;
					prevText = prevText.replace(/\n/g, '<br>');
					$("#translated_text_"+(paragraphNumberInt - 1)).html(prevText);
				}
			},
			error: function (xhr, status, error) {
				disableAutoSave = false;
				console.error('Error loading data:', error);
				$("#hint2").html('load paragraph data error: '+ error);
			}
		});
	} else {
		$("#translated_text_"+(paragraphNumberInt - 1)).html('');
	}
	
}

function exportText() {
	window.open('/export-text', '_blank');
}

function loadLastParagraphWithText() {
	disableAutoSave = true;
	$.ajax({
		url: '/find-last-paragraph-with-text',
		type: 'GET',
		success: function (response) {
			disableAutoSave = false;
			if (response.error) {
				console.error('Error finding last paragraph with text:', response.error);
				$("#hint2").html('load last paragraph with text error: '+ response.error);
			} else if (response.paragraph_number) {
				currentEditingParagraph = response.paragraph_number;
				
				scrollToPA(currentEditingParagraph);
				$("#textareaInput").val('');
				loadParagraphData(currentEditingParagraph);
			}
		},
		error: function (xhr, status, error) {
			disableAutoSave = false;
			$("#hint2").html('load last paragraph with text error: '+ error);
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
	
	setInterval(function () {
		autoSave();
	}, 5000);
	
	
	$("#saveBtn").on('click', function () {
		autoSave();
	});
	
	
	$(".book-text").on('click', function () {
		autoSave();
		
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
	
	
	$('#translateWithAIBtn').on('click', function (e) {
		let url_to_load = '/generate-text/?paragraph_number=' + currentEditingParagraph + '&type=translate&text=' + encodeURIComponent($("#textareaInput").val());
		
		disableButtonsAndShowSpinner('nextBtn');
		console.log('disable next button 2');
		generateTextRequest('textareaInput', 'translateWithAIBtn', url_to_load);
	});
	
	
});
