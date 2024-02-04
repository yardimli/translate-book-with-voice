// Non-standard options
const workerOptions = {
	OggOpusEncoderWasmPath: '/voice/opus/OggOpusEncoder.wasm',
	WebMOpusEncoderWasmPath: '/voice/opus/WebMOpusEncoder.wasm'
};

// Polyfill MediaRecorder
window.MediaRecorder = OpusMediaRecorder;

// Recorder object
let recorder;
let timeSlice = 5;
let recordLanguage = 'tr';
let isRecording = false;
let startLoop = 0;
let startNewFile = 'yes';
var sendInterval = 0;
var sendIntervalCounter = 0;

function startRecorderTimer() {
	isRecording = true;
	recorder.start(timeSlice*1000);
	clearInterval(sendInterval);
	sendIntervalCounter = 0;
	
	sendInterval = setInterval(function () {
		sendIntervalCounter++;
		$("#SendWaitProgressBar").css('width', (Math.round(sendIntervalCounter/timeSlice*10)) + '%');
	}, 100);
	
}




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
			startLoop++;
			sendIntervalCounter = 0;
			$("#SendWaitProgressBar").css('width', '0%');
			
			dataChunks = [];
			dataChunks.push(e.data);
			
			let blob = new Blob(dataChunks, {'type': recorder.mimeType});
			let audioURL = URL.createObjectURL(blob);
			// console.log(audioURL);
			let formData = new FormData();
			formData.append("file", blob, "filename.ogg");
			formData.append("language", recordLanguage);
			formData.append("start_new_file", startNewFile);
			
			$.ajax({
				url: "/save-audio-long-with-chunks",
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
						responseText = responseText.toLowerCase();
						responseText = responseText.trim();
						
						$("#recognitionHistory").prepend(`<span>-- ${responseText}</span><br>`);
						
						var currentText = $("#textareaInput").val();
						$("#textareaInput").val(currentText + ' ' + responseText);
						
						
						
					} else {
						$("#recognitionHistory").prepend(`<span>silence is golden.</span><br>`);
					}
					
				},
				error: function (jqXHR, textStatus, errorMessage) {
					console.log(errorMessage);
				}
			});
			
			startNewFile = 'no';
			if (startLoop > 10) {
				isRecording = false;
				console.log('Start new file');
				startLoop = 0;
				startNewFile = 'yes';
				//stop the recorder then start again
				recorder.stop();
				recorder.stream.getTracks().forEach(i => i.stop());
				//destroy the recorder
				recorder = null;
				
				setTimeout(function () {
					$("#startRecordingButton").click();
				}, 100);
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

//---------------------------------------------------
// Main
$(document).ready(function () {
	
	setTimeout(function () {
		scrollToPA(50);
	}, 1000);
	
	setTimeout(function () {
		scrollToPA(155);
	}, 3000);
	
	
	setTimeout(function () {
		scrollToPA(25);
	}, 5000);
	
	
	$("#startRecordingButton, #recognitionHistory").on('click', function () {
		
		if (!isRecording) {
			$("#startHint").hide();

			startLoop = 0;
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
					} else
					{
						$("#startRecordingButton").text('Stop Recording');
					}
				})
				.then(startRecorderTimer);
		} else
		{
			clearInterval(sendInterval);
			$("#SendWaitProgressBar").css('width', '0%');
			if (recorder && recorder.state === 'recording') {
				isRecording = false;
				recorder.stop();
				
				if (recordLanguage === 'tr') {
					$("#startRecordingButton").text('Kayda Başla');
				} else
				{
					$("#startRecordingButton").text('Start Recording');
				}
			}
			
			// stop all tracks (this will delete a mic icon from a browser tab
			recorder.stream.getTracks().forEach(i => i.stop());
			console.log('Tracks (stream) stopped. click \'Create\' button to capture stream.');
			
			$("#hint").show();
			
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
