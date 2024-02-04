// Non-standard options
const workerOptions = {
	OggOpusEncoderWasmPath: 'http://localhost:8012/voice/opus/OggOpusEncoder.wasm',
	WebMOpusEncoderWasmPath: 'http://localhost:8012/voice/opus/WebMOpusEncoder.wasm'
};

// Polyfill MediaRecorder
window.MediaRecorder = OpusMediaRecorder;

// Recorder object
let recorder;
let timeSlice = 120;
let recordLanguage = 'tr';
let isRecording = false;
let stopRecordingButtonPressed = false;
let additionsHistory = [];
let currentEditingParagraph = 1;

function createMediaRecorder(stream) {
	// Create recorder object
	let options = {mimeType: "audio/ogg"};
	recorder = new MediaRecorder(stream, options, workerOptions);
	
	let dataChunks = [];
	// Recorder Event Handlers
	recorder.onstart = _ => {
		dataChunks = [];
		
		console.log('Recorder started');
	};
	
	recorder.ondataavailable = (e) => {
		if (isRecording) {
			
			dataChunks = [];
			dataChunks.push(e.data);
			
			let blob = new Blob(dataChunks, {'type': recorder.mimeType});
			let audioURL = URL.createObjectURL(blob);
			// console.log(audioURL);
			let formData = new FormData();
			formData.append("file", blob, "filename.ogg");
			formData.append("language", recordLanguage);
			
			$.ajax({
				url: "/save-audio",
				type: "POST",
				headers: {
					'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
				},
				data: formData,
				processData: false,
				contentType: false,
				dataType: "json",
				success: function (response) {
//					console.log(response);
					if (response.result === true &&
						response.hasOwnProperty('openai_results') &&
						response.openai_results.hasOwnProperty('complete') &&
						response.openai_results.complete.hasOwnProperty('text')) {
						
						let responseText = response.openai_results.complete.text;
						responseText = responseText.trim();
						$("#recognitionHistory").prepend(responseText + '<br>');
						
						var currentText = $("#textareaInput").val();
						
						responseTextCommand = responseText.toLowerCase();
						//remove punctuation from the responseTextCommand
						responseTextCommand = responseTextCommand.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
						console.log("POTENTIAL COMMAND: " + responseTextCommand);
						
						if (responseTextCommand === 'yeni satir' || responseTextCommand === 'yeni satır' || responseTextCommand === 'yeni paragraf' || responseTextCommand === 'new line' || responseTextCommand === 'new paragraph') {
							console.log("COMMAND: new line");
							$("#textareaInput").val(currentText + '\n');
							
							additionsHistory.push($("#textareaInput").val());
							
						} else if (responseTextCommand === 'son kaydı sil' || responseTextCommand === 'son satırı sil' || responseTextCommand === 'geri al' || responseTextCommand === 'undo' || responseTextCommand === 'delete last line' || responseTextCommand === 'delete last' || responseTextCommand === 'delete last line' || responseTextCommand === 'delete last paragraph') {
							console.log("COMMAND: undo");
							if (additionsHistory.length > 0) {
								additionsHistory.pop();
								$("#textareaInput").val(additionsHistory[additionsHistory.length - 1]);
							}
							
						} else if (responseTextCommand.indexOf('paragraf') === 0 || responseTextCommand.indexOf('paragraph') === 0) {
							console.log("COMMAND: go to paragraph");
							let paragraphNumber = responseTextCommand.split('paragraf')[1].trim();
							currentEditingParagraph = parseInt(paragraphNumber);
							scrollToPA(currentEditingParagraph);
							$("#textareaInput").val('');
							loadLastInsertedData(currentEditingParagraph);
							
						} else {
							console.log("COMMAND: add text");
							$("#textareaInput").val(currentText + ' ' + responseText);
							
							additionsHistory.push($("#textareaInput").val());
						}
					} else {
						$("#recognitionHistory").prepend(`<span>silence is golden.</span><br>`);
					}
					
				},
				error: function (jqXHR, textStatus, errorMessage) {
					console.log(errorMessage);
				}
			});
			
			isRecording = false;
			
			if (!stopRecordingButtonPressed) {
				
				if (recordLanguage === 'tr') {
					$("#startRecordingButton").text('Kayda Başla');
				} else {
					$("#startRecordingButton").text('Start Recording');
				}
				
				
				recorder.stop();
				
				recorder.stream.getTracks().forEach(i => i.stop());
				//destroy the recorder
				recorder = null;
			}
			
			console.log('Recorder data available');
		} else {
			console.log('Recorder data available but not recording');
		}
	};
	
	recorder.onstop = (e) => {
		isRecording = false;
		console.log('Recorder stopped');
	};
	
	recorder.onpause = _ => console.log('Recorder paused');
	recorder.onresume = _ => console.log('Recorder resumed');
	recorder.onerror = e => console.log('Recorder encounters error:' + e.message);
	
	return stream;
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

var lastSavedText = '';

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
	
	$("#saveButton").text("Saving...");
	let paragraphNumber = currentEditingParagraph; // Assuming you have a variable keeping track of this
	
	// Prepare the data to be sent
	let data = {
		paragraph_number: paragraphNumber,
		paragraph_text: text,
		_token: $('meta[name="csrf-token"]').attr('content') // Include CSRF token
	};
	
	$.ajax({
		url: '/save-text',
		type: 'POST',
		data: data,
		success: function(response) {
			console.log('Auto-saved successfully');
			lastSavedText = text;
			$("#saveButton").text("Save");
			// Optionally update the UI to inform the user of the save
		},
		error: function(xhr, status, error) {
			console.error('Error auto-saving:', error);
			$("#saveButton").text("Save");
			$("#recognitionHistory").prepend(`<span>Auto-save failed.</span><br>`);
			$("#recognitionHistory").prepend(`<span>${error}</span><br>`);
		}
	});
}

function loadLastInsertedData(paragraphNumber) {
	$.ajax({
		url: '/get-text/' + paragraphNumber,
		type: 'GET',
		success: function(response) {
			if (response.paragraph_text) {
				$("#textareaInput").val(response.paragraph_text);
				currentEditingParagraph = paragraphNumber; // Update the current editing paragraph
			}
		},
		error: function(xhr, status, error) {
			console.error('Error loading data:', error);
		}
	});
	
	var paragraphNumberInt = parseInt(paragraphNumber);
	if (paragraphNumberInt > 1) {
		
		$.ajax({
			url: '/get-text/' + (paragraphNumberInt-1),
			type: 'GET',
			success: function (response) {
				if (response.paragraph_text) {
					$("#prevParagraphText").html(response.paragraph_text);
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
//---------------------------------------------------
// Main
$(document).ready(function () {
	
	// Interval to auto-save every 10 seconds
	setInterval(autoSave, 10000);
	
	setTimeout(function () {
		scrollToPA(1);
		$("#textareaInput").val('');
		
		loadLastInsertedData(1);
	}, 1000);
	
	
	//make space key press startRecordingButton
	$(document).keypress(function (e) {
		if (e.which === 32) {
			$("#startRecordingButton").click();
		}
	});

	
	$(".book-text").on('click', function () {
		let paragraphNumber = $(this).data('pa-number');
		scrollToPA(paragraphNumber);
		$("#textareaInput").val('');
		loadLastInsertedData(paragraphNumber);
	});
	
	
	$("#startRecordingButton, #recognitionHistory").on('click', function () {
		stopRecordingButtonPressed = false;
		
		if (!isRecording) {
			
			navigator.mediaDevices.getUserMedia({audio: true, video: false})
				.then((stream) => {
					if (recorder && recorder.state !== 'inactive') {
						console.log('Stop the recorder first');
						throw new Error('Stop the recorder first');
					}
					return stream;
				})
				.then(createMediaRecorder)
				.catch(e => {
					console.log(`MediaRecorder is failed: ${e.message}`);
					Promise.reject(new Error());
				})
				.then(_ => console.log('Creating MediaRecorder is successful.'))
				.then(function () {
					if (recordLanguage === 'tr') {
						$("#startRecordingButton").text('Kaydı Durdur');
					} else {
						$("#startRecordingButton").text('Stop Recording');
					}
					$("#startHint").hide();
					isRecording = true;
					recorder.start(timeSlice * 1000);
					
				});
		} else {
			if (recorder && recorder.state === 'recording') {
				recorder.stop();
				stopRecordingButtonPressed = true;
				
				// stop all tracks (this will delete a mic icon from a browser tab
				recorder.stream.getTracks().forEach(i => i.stop());
				console.log('Tracks (stream) stopped. click \'Create\' button to capture stream.');
				
				if (recordLanguage === 'tr') {
					$("#startRecordingButton").text('Kayda Başla');
				} else {
					$("#startRecordingButton").text('Start Recording');
				}
			}
			
		}
	});
	
	$("#langBtn").on('click', function () {
		if (recordLanguage === 'tr') {
			recordLanguage = 'en';
			$("#langBtn").text('English');
			$("#startRecordingButton").text('Start Recording  ');
			
		} else if (recordLanguage === 'en') {
			recordLanguage = 'tr';
			$("#langBtn").text('Türkçe');
			$("#startRecordingButton").text('Kayda Başla');
		}
	});
});
