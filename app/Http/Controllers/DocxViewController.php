<?php

	namespace App\Http\Controllers;

	use Illuminate\Http\Request;

	use PhpOffice\PhpWord\IOFactory;
	use PhpOffice\PhpWord\Settings;

	class DocxViewController extends Controller
	{
		public function show()
		{

			session()->forget('upload_count');
			session()->forget('base_filename');
			Session()->put('upload_count', 0);
			Session()->put('base_filename', 'combined_' . time());
			session_write_close();

			$file = public_path('docx/Grenser_Borders_Roy Jacobsen.docx'); // Ensure you have example.docx in your public folder

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
						$text .= "<div data-pa-number=\"". $paragraph_count. "\"><p><div style='font-weight: bold; text-align: right;'>PA #". $paragraph_count. "</div>" . $element->getText() . "</p></div>\n";
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
	}

