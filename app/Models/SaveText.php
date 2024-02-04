<?php

	namespace App\Models;

	use Illuminate\Database\Eloquent\Factories\HasFactory;
	use Illuminate\Database\Eloquent\Model;

	class SaveText extends Model
	{
		use HasFactory;

		protected $fillable = [
			'paragraph_number',
			'paragraph_text'
		];
	}
