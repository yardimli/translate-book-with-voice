<?php

	namespace App\Http\Controllers;

	use App\Models\SaveText;
	use Illuminate\Http\Request;

	use Illuminate\Support\Facades\Log;
	use Illuminate\Support\Facades\Validator;
	use PhpOffice\PhpWord\IOFactory;
	use PhpOffice\PhpWord\Settings;
	use Symfony\Component\HttpFoundation\StreamedResponse;

	class DocxViewController extends Controller
	{
		public function show()
		{

			session()->forget('upload_count');
			session()->forget('base_filename');
			Session()->put('upload_count', 0);
			Session()->put('base_filename', 'combined_' . time());
			session_write_close();

			$file = public_path('docx/Grenser_Borders.docx'); // Ensure you have example.docx in your public folder

			// Convert .docx to HTML
			Settings::setOutputEscapingEnabled(true);
			$phpWord = IOFactory::load($file, 'Word2007');

			// Extract text (simple and direct approach)
			$text = '';
			$paragraph_count = 0;
			foreach ($phpWord->getSections() as $section) {
				foreach ($section->getElements() as $element) {
					if (method_exists($element, 'getText')) {
						$paragraph_count++;
						$text .= "<div style='cursor:pointer;' class='book-text' data-pa-number=\"" . $paragraph_count . "\"><p><div style='font-weight: bold; text-align: right;'>PA #" . $paragraph_count . "</div>" . $element->getText() . "</p></div>\n";
					}
				}
			}

			$htmlWriter = IOFactory::createWriter($phpWord, 'HTML');
			$htmlContent = '';
			ob_start();
			$htmlWriter->save('php://output');
			$htmlContent = ob_get_contents();
			ob_end_clean();

			return view('write', compact('htmlContent', 'text'));
		}


		public function ipad_show()
		{

			session()->forget('upload_count');
			session()->forget('base_filename');
			Session()->put('upload_count', 0);
			Session()->put('base_filename', 'combined_' . time());
			session_write_close();

			$file = public_path('docx/Grenser_Borders.docx'); // Ensure you have example.docx in your public folder

			// Convert .docx to HTML
			Settings::setOutputEscapingEnabled(true);
			$phpWord = IOFactory::load($file, 'Word2007');

			// Extract text (simple and direct approach)
			$text = '';
			$paragraph_count = 0;
			foreach ($phpWord->getSections() as $section) {
				foreach ($section->getElements() as $element) {
					if (method_exists($element, 'getText')) {
						$paragraph_count++;
						$text .= "<div style='cursor:pointer;' class='book-text' data-pa-number=\"" . $paragraph_count . "\"><p><div style='font-weight: bold; text-align: right;'>PA #" . $paragraph_count . "</div>" . $element->getText() . "</p><p id='translated_text_". $paragraph_count ."'></p></div>\n";
					}
				}
			}

			$htmlWriter = IOFactory::createWriter($phpWord, 'HTML');
			$htmlContent = '';
			ob_start();
			$htmlWriter->save('php://output');
			$htmlContent = ob_get_contents();
			ob_end_clean();

			return view('ipad-write', compact('htmlContent', 'text'));
		}


		//-------------------------------------------------------------------------

		public static function openAI_question($messages, $temperature, $max_tokens, $gpt_engine)
		{
			set_time_limit(300);

			$user_id = "1";  //  users id optional

			//parse the $chat_messages array select the last content belonging to the user
			$message = $messages[count($messages) - 1]['content'];
			Log::info('message: ' . $message);

			$disable_validation = true;
			if (!$disable_validation) {

				$mod_result = self::moderation($message);

				$flag_reason = '';

				Log::info('mod_result: ' . json_encode($mod_result));
				if ($mod_result['results'][0]['flagged'] == true ||
					$mod_result['results'][0]['category_scores']['hate'] > 0.4 ||
					$mod_result['results'][0]['category_scores']['sexual'] > 0.6 ||
					$mod_result['results'][0]['category_scores']['violence'] > 0.6 ||
					$mod_result['results'][0]['category_scores']['self-harm'] > 0.6 ||
					$mod_result['results'][0]['category_scores']['sexual/minors'] > 0.6 ||
					$mod_result['results'][0]['category_scores']['hate/threatening'] > 0.4 ||
					$mod_result['results'][0]['category_scores']['violence/graphic'] > 0.6
				) {
					//clear $messages array
//				$messages = [];
					if ($mod_result['results'][0]['category_scores']['hate'] > 0.4) {
						$flag_reason = 'hate';
					}
					if ($mod_result['results'][0]['category_scores']['sexual'] > 0.6) {
						$flag_reason = 'sexual';
					}
					if ($mod_result['results'][0]['category_scores']['violence'] > 0.6) {
						$flag_reason = 'violence';
					}
					if ($mod_result['results'][0]['category_scores']['self-harm'] > 0.6) {
						$flag_reason = 'self-harm';
					}
					if ($mod_result['results'][0]['category_scores']['sexual/minors'] > 0.6) {
						$flag_reason = 'sexual/minors';
					}
					if ($mod_result['results'][0]['category_scores']['hate/threatening'] > 0.4) {
						$flag_reason = 'hate/threatening';
					}
					if ($mod_result['results'][0]['category_scores']['violence/graphic'] > 0.6) {
						$flag_reason = 'violence/graphic';
					}
				}

				if ($flag_reason !== '') {
					Log::info($flag_reason);

					$messages[] = [
						'role' => 'system',
						'content' => 'Tell the user why the message the following request they made is flagged as inappropriate. Tell to Please write a request that doesnt break MySong Cloud guidelines. When telling them why they can\'t write use MySong Cloud instead of OpenAI. Reason for the problem is: ' . $flag_reason
					];
					$messages[] = [
						'role' => 'user',
						'content' => 'why can\'t i write about this topic?'
					];

				}
			}

			$prompt_tokens = 0;
			foreach ($messages as $message) {
				$prompt_tokens += round(str_word_count($message['content']) * 1.25);
			}
			$prompt_tokens = (int)$prompt_tokens;


			$data = array(
				'model' => $gpt_engine, // 'gpt-3.5-turbo', 'gpt-4',
				'messages' => $messages,
				'temperature' => $temperature,
				'max_tokens' => $max_tokens,
				'top_p' => 1,
				'frequency_penalty' => 0,
				'presence_penalty' => 0,
				'n' => 1,
				'stream' => true,
				'stop' => "" //"\n"
			);

			session_write_close();
			$txt = '';
			$completion_tokens = 0;

			Log::info('openAI_question: ');
			Log::info($data);

			$gpt_base_url = env('OPEN_AI_API_BASE');
			$gpt_api_key = env('OPEN_AI_API_KEY');

			$post_json = json_encode($data);
			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, $gpt_base_url . '/chat/completions');
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $post_json);

			$headers = array();
			$headers[] = 'Content-Type: application/json';
			$headers[] = "Authorization: Bearer " . $gpt_api_key;
			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

			$accumulatedData = '';

			curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($curl_info, $data) use (&$txt, &$completion_tokens, &$accumulatedData) {

//				Log::info($data);


				$data_lines = explode("\n", $data);
				for ($i = 0; $i < count($data_lines); $i++) {
					$data_line = $data_lines[$i];

					// Check if the data line contains [DONE]
					if (stripos($data_line, "[DONE]") !== false) {
						Log::info('OpenAI [DONE]');
						echo "data: [DONE]\n\n";
						ob_flush();
						flush();
						return strlen($data_line);
					}

					$completion_tokens++;

					// Append new data to the accumulated data
					if (substr($data_line, 0, 5) !== "data:") {
						$accumulatedData .= $data_line;
					} else {
						$accumulatedData = $data_line;
					}

					// Check if we have a complete JSON object
					$clean = str_replace("data: ", "", $accumulatedData);
					$decoded = json_decode($clean, true);
					if ($decoded && isset($decoded["choices"])) {
						echo $accumulatedData . "\n";
						echo PHP_EOL;
						ob_flush();
						flush();

						$txt .= $decoded["choices"][0]["delta"]["content"] ?? '';
						$accumulatedData = ''; // Reset accumulated data
					}
				}

				return strlen($data);
			});

			$result = curl_exec($ch);
//		Log::info('curl result:');
//		Log::info($result);
			curl_close($ch);

			return array('message_text' => $txt, 'completion_tokens' => $completion_tokens, 'prompt_tokens' => $prompt_tokens);
		}

		public static function generateText($paragraph_number, $text)
		{
			Log::info('generate Text (1): ' . $paragraph_number . ' ' . $text);

			@ini_set('zlib.output_compression', 0);
			@ini_set('implicit_flush', 1);
			header('Content-type: text/event-stream');
			header('Cache-Control: no-cache');

			$open_ai_query = "You are a novel and literature translator expert. You are expert in translating from Norwegian to Turkish.\n\n";

			$chat_messages = [];

			$chat_messages[] = [
				'role' => 'system',
				'content' => $open_ai_query
			];


			$file = public_path('docx/Grenser_Borders.docx'); // Ensure you have example.docx in your public folder

			// Convert .docx to HTML
			Settings::setOutputEscapingEnabled(true);
			$phpWord = IOFactory::load($file, 'Word2007');

			// Extract text (simple and direct approach)
			$paragraph_number = (int)$paragraph_number;

			$paragraph_count = 0;
			$break_loop = false;
			foreach ($phpWord->getSections() as $section) {
				if ($break_loop) {
					break;
				}
				foreach ($section->getElements() as $element) {
					if ($break_loop) {
						break;
					}

					if (method_exists($element, 'getText')) {
						$paragraph_count++;

						if ($paragraph_count === $paragraph_number - 2 || $paragraph_count === $paragraph_number - 1) {

							$translated_text = SaveText::where('paragraph_number', $paragraph_count)->latest()->first();
							if ($translated_text) {
								Log::info('paragraph_count: ' . $paragraph_count . ' text found');
								$chat_messages[] = [
									'role' => 'user',
									'content' => $element->getText()
								];

								$chat_messages[] = [
									'role' => 'assistant',
									'content' => $translated_text['paragraph_text']
								];
							} else
							{
								Log::info('paragraph_count: ' . $paragraph_count . ' text not found');
							}
						} else
							if ($paragraph_count === $paragraph_number) {
								$chat_messages[] = [
									'role' => 'user',
									'content' => $element->getText()
								];


								if ($text !== '' && $text !== null) {
									$chat_messages[] = [
										'role' => 'assistant',
										'content' => $text
									];
								}
								$break_loop = true;
							}
					}
				}
			}

			$answer_temp_value = 0.7;

			$aiUserResponse = self::openAI_question($chat_messages, $answer_temp_value, 1012, env('GPT_ENGINE', 'gpt-4-turbo-preview')); //gpt-4 or gpt-3.5-turbo

			return $aiUserResponse;
		}

		public static function generateTextRequest(Request $request)
		{
			Log::info('generate Text Request (1): ' . json_encode($request->all()));

			$validator = Validator::make($request->all(), [
				'paragraph_number' => 'required',
//				'text' => 'required',
			]);

			if ($validator->fails()) {
				// Return a JSON response with the errors
				$response = new StreamedResponse();
				$response->headers->set('Content-Type', 'text/event-stream');
				$response->headers->set('Cache-Control', 'no-cache');
				$response->headers->set('Connection', 'keep-alive');
				$response->setCallback(function () use ($validator) {
					echo "data: " . json_encode(['errors' => $validator->errors()]) . "\n\n";
					ob_flush();
					flush();
				});

				return $response->send();

			}


			$LyricsResults = self::generateText($request->input('paragraph_number'), $request->input('text'));

			Log::info('generate Lyrics (2): ');
			Log::info($LyricsResults);


		}

	}

