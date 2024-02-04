$(document).ready(function () {
	const sampleRate = 16000;
	let isRecording = false;
	let handle;
	
	const socket = io.connect('http://localhost:8081');
	
	const startButton = document.getElementById('startButton');
	const stopButton = document.getElementById('stopButton');
	const recognitionHistory = document.getElementById('recognitionHistory');
	const currentRecognition = document.getElementById('currentRecognition');
	
	let stopTimer = null;
	
	startButton.addEventListener('click', function () {
		startButton.disabled = true;
		stopButton.disabled = false;
		
		socket.emit('startGoogleCloudStream');
		
		let mediaSource = navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: "default",
				sampleRate: sampleRate,
				sampleSize: 16,
				channelCount: 1,
			},
			video: false,
		}).then(function (stream) {
			handle = setInterval(function () {
				let chunks = [];
				const recorder = new MediaRecorder(stream, {mimeType: 'audio/webm'});
				recorder.start();
				
				// Accumulating audio chunks
				recorder.ondataavailable = function (event) {
//					console.log("data available ", event.data.size, " ", event.data.type, " ", event.data);
					chunks.push(event.data);
				};
				
				// After the recording stops
				recorder.onstop = function () {
//					console.log(chunks);
					let blob = new Blob(chunks, {'type': 'audio/webm'});
					var reader = new FileReader();
					reader.onload = function () {
						var buffer = this.result;
						socket.emit('send_audio_data', {audio: buffer});
					};
					reader.readAsArrayBuffer(blob);
				};
				
				// Stop the recorder after 1 second
				setTimeout(function () {
					recorder.stop();
				}, 1000);
			}, 1000);
		});
		isRecording = true;
		
		stopTimer = setTimeout(function () {
			stopButton.click();
			console.log("Stopped recording after 120 seconds");
			alert("Stopped recording after 120 seconds");
		}, 120000);
	});
	
	stopButton.addEventListener('click', function () {
		startButton.disabled = false;
		stopButton.disabled = true;
		
		socket.emit('endGoogleCloudStream');
		
		clearInterval(handle);
		
		isRecording = false;
	});
	
	socket.on('receive_audio_text', function (data) {
		console.log(data);
		if (data.isFinal) {
			currentRecognition.textContent = "...";
			recognitionHistory.innerHTML = `<span>${data.text}</span><br>` + recognitionHistory.innerHTML;
			let move_string = convertString(data.text);
			if (move_string === '') {
				recognitionHistory.innerHTML = `<span>Invalid move</span><br>` + recognitionHistory.innerHTML;
			} else
			{
				recognitionHistory.innerHTML = `<span>${move_string}</span><br>` + recognitionHistory.innerHTML;
				
				undo_stack = [];
				removeGreySquares();
				board.move(move_string);
				
				let move_parts = move_string.split('-');
				
				// see if the move is legal
				var move = game.move({
					from: move_parts[0],
					to: move_parts[1],
					promotion: 'q', // NOTE: always promote to a queen for example simplicity
				});
				
				// Illegal move
				if (move === null) return 'snapback';
				
				globalSum = evaluateBoard(game, move, globalSum, 'b');
				updateAdvantage();
				
				// Highlight latest move
				$board.find('.' + squareClass).removeClass('highlight-white');
				
				$board.find('.square-' + move.from).addClass('highlight-white');
				squareToHighlight = move.to;
				colorToHighlight = 'white';
				
				$board
					.find('.square-' + squareToHighlight)
					.addClass('highlight-' + colorToHighlight);
				
				
				if (!checkStatus('black'));
				{
					console.log("!!!");
					// Make the best move for black
					window.setTimeout(function () {
						makeBestMove('b');
						window.setTimeout(function () {
							showHint();
						}, 250);
					}, 500);
				}
				
			}
			
		} else {
			currentRecognition.textContent = data.text + "...";
		}
	});
});
function convertString(str) {
	str = str.trim();
	str = str.toLowerCase();
	
	str = str.replace('reyhan','ceyhan');
	
	if (typeof str !== 'string' || (!str.startsWith('oy') && !str.startsWith('ay') && !str.startsWith('on') && !str.startsWith('gi'))) {
		return '';
	}
	str = str.replace('bir','1');
	str = str.replace('iki','2');
	str = str.replace('üç','3');
	str = str.replace('dört','4');
	str = str.replace('beş','5');
	str = str.replace('altı','6');
	str = str.replace('yedi','7');
	str = str.replace('sekiz','8');
	
	const cleaned = str.substr(str.indexOf(' ') + 1).trim();
	let result   = '';
	let counter  = 0;
	let isLetter = true;
	let tempStr  = '';
	
	for (let i = 0; i < cleaned.length; i++) {
		const ch = cleaned.charAt(i);
		if (isLetter && ch >= 'a' && ch <= 'z') {
			tempStr += ch;
			isLetter = false;
			counter++;
		}
		else if (!isLetter && ch >= '0' && ch <= '9') {
			tempStr += ch;
			isLetter = true;
			if (counter === 1) {
				tempStr += '-';
			}
			counter++;
		}
		if(tempStr.length===5){
			result = tempStr;
			break;
		}
	}
	return result;
}

console.log('---' + convertString('oyna alpha2 a 4'));
console.log('---' + convertString('oyna Ceyhan 2 ceyhan 4'));
console.log('---' + convertString("oyna ceyhan 4 denizli 5\n"));
