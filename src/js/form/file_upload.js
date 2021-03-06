/**
 * pxlCore/Form/FileUpload
 * @param {string} $pxl - pxlCore object reference.
 * @constructor
 */
function pxlCore_Form_FileUpload($pxl)
{
	this._init($pxl);
}

pxlCore_Form_FileUpload.prototype =
{
	$pxl: null,

	save_url: null,
	additional_data: {},

	files: [],
	num_files: 0,
	num_files_without_error: 0,

	num_processed_files: 0,
	num_processed_files_without_error: 0,

	allowed_mime_types: null,
	max_file_size: null,

	events: null,

	is_uploading: false,
	cancelled: false,

	_init: function($pxl)
	{
		var self = this;

		self.$pxl = $pxl;
	},

	init: function(save_url, additional_data, allowed_mime_types, events)
	{
		var self = this;

		self.save_url = save_url;
		self.additional_data = (self.$pxl.isObject(additional_data) ? additional_data : {});

		self.allowed_mime_types = allowed_mime_types;
		self.events = events;

		return self;
	},

	checkFileType: function(file)
	{
		var self = this;

		if ( self.allowed_mime_types === null )
		{
			return true;
		}

		if ( !self.$pxl.inArray(file.type, self.allowed_mime_types) )
		{
			//self.throwError('Selected file type (' + file.type + ') is not valid (Allowed file types are: ' + $pxl.implode(', ', self.allowed_mime_types, ' and ') + ').');

			return false;
		}

		return true;
	},

	checkFileSize: function(file)
	{
		var self = this;

		if ( self.max_file_size === null )
		{
			return true;
		}

		return true;
	},

	start: function()
	{
		var self = this;

		self.cancelled = false;
		self.is_uploading = true;

		self.processQueueFile();
	},

	processQueueFile: function()
	{
		var self = this;

		var file = self.files[self.num_processed_files];

		var postSave = function(_file, error)
		{
			if ( self.cancelled === true )
			{
				return;
			}

			if ( self.$pxl.isFunction(self.events.onFileComplete) )
			{
				self.events.onFileComplete(
				{
					file: self.files[self.num_processed_files],
					file_index: self.num_processed_files,
					num_files: self.num_files_without_error,
					percent: Math.round((self.num_processed_files_without_error / self.num_files_without_error) * 100),
					error: error
				});
			}

			if ( self.num_processed_files < (self.num_files - 1) )
			{
				self.num_processed_files++;

				if ( _file.error === false )
				{
					self.num_processed_files_without_error++;
				}

				self.processQueueFile();
			}
			else
			{
				if ( self.$pxl.isFunction(self.events.onAllComplete) )
				{
					self.events.onAllComplete();
				}

				pxl_file_upload.clearQueue();

				self.is_uploading = false;
			}
		};

		if ( self.$pxl.isFunction(self.events.onBeforeFileUpload) )
		{
			self.events.onBeforeFileUpload(
			{
				file: self.files[self.num_processed_files],
				file_index: self.num_processed_files,
				num_files: self.num_files_without_error
			});
		}

		if ( file.error === false )
		{
			var additional_data = self.additional_data;
			additional_data['X-Pxl-Original-Filename'] = file.file.name;
			additional_data['X-Pxl-Size'] = file.file.size;
			additional_data['X-Pxl-Mime'] = file.file.type;

			self.$pxl.ajax.post
			(
				self.save_url,
				file.file,
				{
					progress: function(percent)
					{
						if ( self.$pxl.isFunction(self.events.onFileProgress) )
						{
							self.events.onFileProgress(
							{
								file: file,
								file_index: self.num_processed_files,
								percent: percent
							});
						}
					},
					success: function(result)
					{
						var file = self.files[self.num_processed_files];

						if ( self.$pxl.isFunction(self.events.onFileComplete) )
						{
							self.events.onFileComplete(
							{
								file: file,
								file_index: self.num_processed_files,
								result: result
							});
						}

						postSave(file, null);
					},
					error: function(error)
					{
						if ( self.cancelled === false )
						{
							if ( self.$pxl.isFunction(self.events.onFileError) )
							{
								self.events.onFileError(
								{
									file: file,
									file_index: self.num_processed_files,
									error: error
								});
							}

							postSave(file, error);
						}
					}
				},
				{
					file_upload: true,
					file_upload_data: additional_data
				}
			);
		}
		else
		{
			postSave(file, null);
		}
	},

	throwError: function(error)
	{
		var self = this;

		if ( typeof self.events.onError === 'function' )
		{
			self.events.onError(error);
		}
	},

	removeFileFromQueue: function(index)
	{
		var self = this;

		if ( self.$pxl.isUndefined(self.files[index]) )
		{
			if ( self.$pxl.options.debug === true )
			{
				self.$pxl.error('Could not find queue file on index ' + index + '.');
			}

			return;
		}

		self.files.splice(index, 1);
		self.num_files--;
	},

	getFiles: function()
	{
		var self = this;

		var files = [];

		for ( var i = 0; i < self.num_files; i++ )
		{
			var file = self.files[i];

			files.push(
			{
				file:
				{
					name: file.file.name,
					type: file.file.type,
					size: file.file.size
				},
				error: file.error,
				errors: file.errors
			});
		}

		return files;
	},

	getFile: function(index)
	{
		if ( self.$pxl.isUndefined(this.files[index]) )
		{
			return null;
		}

		return this.files[index];
	},

	clearQueue: function()
	{
		var self = this;

		self.files = [];
		self.num_files = 0;
		self.num_files_without_error = 0;

		self.num_processed_files = 0;
		self.num_processed_files_without_error = 0;
	},

	addFilesToQueue: function(files)
	{
		var self = this;

		for ( var file_index = 0, num_files = files.length; file_index < num_files; file_index++ )
		{
			var file = files[file_index];

			var file_obj =
			{
				file: file,
				errors:
				{
					mime: false,
					size: false
				},
				error: false
			};

			if ( self.checkFileType(file) === false )
			{
				file_obj.errors.mime = true;
				file_obj.error = true;
			}

			if ( self.checkFileSize(file) === false )
			{
				file_obj.errors.size = true;
				file_obj.error = true;
			}

			if ( file_obj.error === false )
			{
				self.num_files_without_error++;
			}

			self.files.push(file_obj);
		}

		self.num_files = self.files.length;
	},

	cancel: function()
	{
		var self = this;

		if ( self.num_files === 0 )
		{
			return;
		}

		self.cancelled = true;

		if ( !self.$pxl.isUndefined(self.$pxl.ajax.requests[self.save_url]) )
		{
			self.$pxl.ajax.requests[self.save_url].abort();
		}

		var was_uploading = (self.is_uploading === true);

		self.is_uploading = false;

		if ( self.$pxl.isFunction(self.events.onCancel) )
		{
			self.events.onCancel(
			{
				file: self.files[self.num_processed_files],
				file_index: self.num_processed_files,
				was_uploading: was_uploading
			});
		}

		self.clearQueue();
	}
};