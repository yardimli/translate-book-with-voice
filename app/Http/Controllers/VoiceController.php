<?php

	namespace App\Http\Controllers;

	use App\Models\SaveText;
	use CURLFile;
	use Illuminate\Http\Request;
	use Illuminate\Support\Facades\Log;
	use Illuminate\Support\Facades\Storage;

	class VoiceController extends Controller
	{


		function saveText(Request $request)
		{
			$request->validate([
				'paragraph_number' => 'required|string',
//				'paragraph_text' => 'required|string',
			]);

			SaveText::updateOrCreate(
				['paragraph_number' => $request->paragraph_number],
				['paragraph_text' => $request->paragraph_text]
			);

			return response()->json(['success' => true]);
		}

		function getText($paragraphNumber)
		{
			$text = SaveText::where('paragraph_number', $paragraphNumber)->first();

			return response()->json($text ? $text : ['error' => 'Text not found']);
		}


		function save_audio(Request $request)
		{
			if ($request->hasFile('file')) {
				$file = $request->file('file');
				$language = $request->input('language');

				$baseFilename = 'single_combined_' . time();

				Log::info('--------------------------------------------------------');
				Log::info('simple save_audio called with language: ' . $language . ' and file name: ' . $file . ' and baseFilename: ' . $baseFilename);

				// Check if the directory exists
				$audioDir = storage_path("app/temp-audio/");
				if (!Storage::disk('local')->exists('temp-audio')) {
					Storage::disk('local')->makeDirectory('temp-audio');
				}

				// Full path to the file
				$audioPath = $audioDir . $baseFilename;
				Log::info('audioPath: ' . $audioPath);
				$audioData = file_get_contents($file->getRealPath());
				$audiofile = $audioPath . '.ogg';

				file_put_contents($audiofile, $audioData);

				$openai_results = self::openAI_transcribe($audiofile, $language);
				$post_result= true;

			} else {
				$baseFilename = 'single_combined_' . time();
				$openai_results = array();
				$post_result= false;
			}

			return response()->json(["result" => $post_result, "message" => "File uploaded", "base_filename" => $baseFilename, "openai_results" => $openai_results]);

		}

		function save_audio_long_with_chunks(Request $request)
		{
			if ($request->hasFile('file')) {
				$file = $request->file('file');
				$language = $request->input('language');
				$start_new_file = $request->input('start_new_file');

				if ($start_new_file === 'yes') {
					//reset session
					session()->forget('upload_count');
					session()->forget('base_filename');
					Session()->put('upload_count', 0);
					Session()->put('base_filename', 'combined_' . time());
					Session()->put('processed_files', '');
					session_write_close();
				}

				// Initialize or get the count of uploads from the session
				$uploadCount = session()->get('upload_count', 0);
				$baseFilename = session()->get('base_filename', 'combined_' . time());

				Log::info('--------------------------------------------------------');
				Log::info('uploadCount: ' . $uploadCount);
				Log::info('baseFilename: ' . $baseFilename);

				// Check if the directory exists
				$audioDir = storage_path("app/temp-audio/");
				if (!Storage::disk('local')->exists('temp-audio')) {
					Storage::disk('local')->makeDirectory('temp-audio');
				}

				// Full path to the file
				$audioPath = $audioDir . $baseFilename;
				Log::info('audioPath: ' . $audioPath);

				$uploadCount++;
				session()->put('upload_count', $uploadCount);
				Log::info('uploadCount: ' . $uploadCount);

				if ($uploadCount >= 100) {
					//stop processing
					return response()->json(["result" => true, "message" => "File uploaded", "filename" => $baseFilename, "upload_count" => $uploadCount]);
				}

				// Append new audio data to the existing file
				$audioData = file_get_contents($file->getRealPath());

				file_put_contents($audioPath . '.ogg', $audioData, FILE_APPEND);

				$cmd = "ffmpeg -y -i " . escapeshellarg($audioPath . ".ogg") . " -af silencedetect=noise=-40dB:d=2 -f null - 2> " . escapeshellarg($audioPath . ".log");
				Log::info('ffmpeg cmd: ' . $cmd);

				exec($cmd, $output, $return_var);
				Log::info('ffmpeg output: ');
				Log::info(implode("\n", $output));
				Log::info('ffmpeg return_var: ' . $return_var);

				if (file_exists($audioPath . ".log") && is_readable($audioPath . ".log")) {
					// Open the file for reading
					$logFile = fopen($audioPath . ".log", 'r');

					$silence_list = array();

					$audio_duration = 0.0;

					while (($line = fgets($logFile)) !== false) {
						if (preg_match('/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/', $line, $matches)) {
							$audio_duration = $matches[1]; //00:00:09.76
							Log::info('audio_duration: ' . $audio_duration);
							//converting to seconds and milliseconds rounded to 2 decimal places
							$audio_duration = explode(":", $audio_duration);
							$audio_duration = (float)$audio_duration[0] * 3600 + (float)$audio_duration[1] * 60 + (float)$audio_duration[2];
							$audio_duration = round($audio_duration, 2);
						}

						// Use regular expression to match silence start and end times
						if (preg_match('/silence_start: ([\d.]+)/', $line, $startMatches)) {
							$silence_list[] = array('start' => $startMatches[1]);
						}
						if (preg_match('/silence_end: ([\d.]+) \|/', $line, $endMatches)) {
							$silence_list[count($silence_list) - 1]['end'] = $endMatches[1];
						}
					}
					fclose($logFile); // Close the file handle

					Log::info('audio_duration: ' . $audio_duration);
					Log::info('silence_list: ');
					Log::info($silence_list);

					// Calculate non-silent parts durations
					$non_silent_parts = [];
					$last_end = 0.0; // Assume the audio starts from 0.0 seconds

					foreach ($silence_list as $index => $silence) {
						if ($last_end < (float)$silence['start']) {
							$non_silent_parts[] = [
								'start' => $last_end,
								'end' => (float)$silence['start']
							];
						}
						$last_end = (float)$silence['end'];
					}

					if ($last_end < $audio_duration) {
						$non_silent_parts[] = [
							'start' => $last_end,
							'end' => $audio_duration
						];
					}

					// Construct the complex filtergraph for FFmpeg
					$filters = [];
					$outputs = [];

					foreach ($non_silent_parts as $index => $part) {
						$start = $part['start'];
						$end = $part['end'];
						$duration = $end - $start;

						$filters[] = "[0:a]atrim=start={$start}:end={$end},asetpts=PTS-STARTPTS[part{$index}]";
						$outputs[] = "-map [part{$index}] {$audioPath}_parts_{$index}.ogg";
					}

					$complex_filter = implode(';', $filters);
					$output_files = implode(' ', $outputs);

					$ffmpeg_command = "ffmpeg -y -i " . escapeshellarg($audioPath . ".ogg") . " -filter_complex \"" . $complex_filter . "\" " . $output_files;

					Log::info('ffmpeg_command: ' . $ffmpeg_command);

					exec($ffmpeg_command);

					$openai_results = array();

					$processed_files = session()->get('processed_files', '');
					foreach ($non_silent_parts as $index => $part) {

						if ($index === count($non_silent_parts) - 1) {
							// Skip processing for the last item
							continue;
						}

						$audiofile = $audioPath . "_parts_" . $index . ".ogg";
						if (file_exists($audiofile) && stripos($processed_files, $audiofile) === false) {
							$processed_files .= $audiofile . ',';
							$openai_results = self::openAI_transcribe($audiofile, $language);
							break;
						} else {
							if (!file_exists($audiofile)) {
								Log::info('******* audiofile does not exist: ' . $audiofile);
							} else {
								Log::info('******* audiofile already processed: ' . $audiofile);
							}
						}
					}

					session()->put('processed_files', $processed_files);
				}

				echo json_encode(array("result" => true, "message" => "File uploaded", "base_filename" => $baseFilename, "openai_results" => $openai_results, "upload_count" => $uploadCount, "audio_duration" => $audio_duration, "non_silent_parts" => $non_silent_parts, "processed_files" => $processed_files));
			} else {
				return response()->json(["result" => false, "message" => "No file uploaded"]);
			}

		}

		function save_audio_with_chunks(Request $request)
		{

			if ($request->hasFile('file')) {
				$file = $request->file('file');
				$errors = array();
				$file_name = $file->getClientOriginalName();
				$file_size = $file->getSize();
				$file_tmp = $file->getRealPath();
				$file_type = $file->getMimeType();

				$language = $request->input('language');


				//create temp filename with timestamp
				$filename = pathinfo(basename($file_name), PATHINFO_FILENAME);
				$extension = pathinfo(basename($file_name), PATHINFO_EXTENSION);
				$safe_file_name = preg_replace("/[^a-zA-Z0-9]/", "_", $filename);
				$safe_file_name_with_ext = $safe_file_name . '_' . time() . '.' . $extension;

				if (empty($errors) == true) {
					// Check if the directory exists
					if (!Storage::disk('local')->exists('temp-audio')) {
						// Create the directory
						Storage::disk('local')->makeDirectory('temp-audio');
					}

					// Move the file to the directory
					$file->storeAs('temp-audio', $safe_file_name_with_ext);

					$file_upload_result = $safe_file_name_with_ext;

					if (file_exists(storage_path("app/temp-audio/" . $safe_file_name_with_ext))) {
						$openai_results = self::openAI_transcribe(storage_path("app/temp-audio/" . $safe_file_name_with_ext), $language);
					} else {
						Log::info('******* audiofile does not exist: ' . storage_path("app/temp-audio/" . $safe_file_name_with_ext));
						$openai_results = array('complete' => array('complete' => array('text' => 'voice recognition failed.')));
					}

					echo json_encode(array("result" => true, "message" => "File uploaded", "file_upload_result" => $file_upload_result, "openai_results" => $openai_results));
				} else {
					echo json_encode(array("result" => false, "message" => "Error uploading file", "errors" => $errors));
				}
			} else {
				echo json_encode(array("result" => false, "message" => "No file uploaded"));
			}

		}

		function openAI_transcribe($audio_file, $language)
		{
			set_time_limit(300);

			session_write_close();

			$gpt_base_url = env('OPEN_AI_API_BASE');
			$gpt_api_key = env('OPEN_AI_API_KEY');

			if ($language === 'en') {
				$prompt = 'Write book in English';
			} else
				if ($language === 'tr') {
					$prompt = 'Write book in Turkish';
				}

			$voice_data = array(
				'file' => new CURLFile($audio_file, 'audio/ogg', 'audio_file'), //$audio_file,
				'model' => 'whisper-1',
				'language' => $language,
				'format' => 'text',
				'prompt' => $prompt
			);

			Log::info('call openAI transcribe with: ' . $audio_file . ' and file size: ' . filesize($audio_file) . ' bytes');

			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, $gpt_base_url . '/audio/transcriptions');
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $voice_data);

			$headers = array();
//		$headers[] = 'Content-Type: application/json';
			$headers[] = 'Content-Type: multipart/form-data';
			$headers[] = "Authorization: Bearer " . $gpt_api_key;
			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

			$complete = curl_exec($ch);
			$curl_error = '';
			if (curl_errno($ch)) {
				$curl_error = 'Error:' . curl_error($ch);
			}
			curl_close($ch);

			//if $complete is a JSON string, then return it
			$completeArray = json_decode($complete, true);
			if (json_last_error() === JSON_ERROR_NONE) {
				return array('complete' => $completeArray, 'curl_error' => $curl_error);
			} else {
				return array('complete' => array('complete' => array('text' => 'voice recognition failed.')), 'complete_result' => $complete, 'curl_error' => $curl_error);
			}
		}
	}

