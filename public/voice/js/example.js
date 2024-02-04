// Non-standard options
const workerOptions = {
	OggOpusEncoderWasmPath: 'https://local.elosoft.tw/voice/php-server/opus/OggOpusEncoder.wasm',
	WebMOpusEncoderWasmPath: 'https://local.elosoft.tw/voice/php-server/opus/WebMOpusEncoder.wasm'
};

// Polyfill MediaRecorder
window.MediaRecorder = OpusMediaRecorder;

// Recorder object
let recorder;
let timeSlice = 60000;

$(document).ready(function() {

// This creates a MediaRecorder object
	$("#buttonCreate").on('click', function() {
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
			.then(updateButtonState);
	});
	
	function createMediaRecorder(stream) {
		// Create recorder object
		let options = {mimeType: "audio/wave"};
		recorder = new MediaRecorder(stream, options, workerOptions);
		
		let dataChunks = [];
		// Recorder Event Handlers
		recorder.onstart = _ => {
			dataChunks = [];
			
			console.log('Recorder started');
			updateButtonState();
		};
		
		recorder.ondataavailable = (e) => {
			dataChunks.push(e.data);
			
			console.log('Recorder data available');
			updateButtonState();
		};
		
		recorder.onstop = (e) => {
			// When stopped add a link to the player and the download link
			let blob = new Blob(dataChunks, {'type': recorder.mimeType});
			dataChunks = [];
			let audioURL = URL.createObjectURL(blob);
			console.log(audioURL);
			
			let formData = new FormData();
			formData.append("file", blob, "filename.wav");
			
			$.ajax({
				url: "get-audio.php",
				type: "POST",
				data: formData,
				processData: false,
				contentType: false,
				success: function (response) {
					console.log(response);
				},
				error: function (jqXHR, textStatus, errorMessage) {
					console.log(errorMessage);
				}
			});
			
			// player.src = audioURL;
			// link.href = audioURL;
			// let extension = recorder.mimeType.match(/ogg/) ? '.ogg'
			// 	: recorder.mimeType.match(/webm/) ? '.webm'
			// 		: recorder.mimeType.match(/wav/) ? '.wav'
			// 			: '';
			// link.download = 'recording' + extension;
			//
			
			console.log('Recorder stopped');
			updateButtonState();
		};
		
		recorder.onpause = _ => console.log('Recorder paused');
		recorder.onresume = _ => console.log('Recorder resumed');
		recorder.onerror = e => console.log('Recorder encounters error:' + e.message);
		
		return stream;
	}

	$("#buttonStart").on('click', function() {
		recorder.start(timeSlice);
	});
	
	$("#buttonStop").on('click', function() {
		recorder.stop();
	});
	
	$("#buttonStopTracks").on('click', function() {
		// stop all tracks (this will delete a mic icon from a browser tab
		recorder.stream.getTracks().forEach(i => i.stop());
		console.log('Tracks (stream) stopped. click \'Create\' button to capture stream.');
	});

// Update state of buttons when any buttons clicked
	function updateButtonState() {
		switch (recorder.state) {
			case 'inactive':
				$('#buttonCreate').prop('disabled', false);
				$('#buttonStart').prop('disabled', false);
				$('#buttonStop').prop('disabled', true);
				$('#buttonStopTracks').prop('disabled', false); // For debugging purpose
				$('#status').html('Recorder is ready. Click "start" button to begin recording.');
				break;
			case 'recording':
				$('#buttonCreate').prop('disabled', true);
				$('#buttonStart').prop('disabled', true);
				$('#buttonStop').prop('disabled', false);
				$('#buttonStopTracks').prop('disabled', false); // For debugging purpose
				$('#status').html('Recording. Click "stop" button to play recording.');
				break;
			case 'paused':
				$('#buttonCreate').prop('disabled', true);
				$('#buttonStart').prop('disabled', false);
				$('#buttonStop').prop('disabled', false);
				$('#buttonStopTracks').prop('disabled', false); // For debugging purpose
				$('#status').html('Paused. Click "resume" button.');
				break;
			default:
				// Maybe recorder is not initialized yet so just ingnore it.
				break;
		}
	}
	
});

