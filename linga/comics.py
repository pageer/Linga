import os
import os.path
import zipfile

from app import (get_app, get_config, get_db)

COMIC_ARCHIVE_EXTENSIONS = ['.cbz']
COMIC_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif']
COMIC_IMAGE_MIME_MAP = {
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/png': ['.png'],
	'image/gif': ['.gif'],
}

def path_to_book(path):
	if is_supported_format(path):
		return Comic(path)
	else:
		raise Exception('Unsupported format')

def relpath_to_book(path, basepath=''):
	if basepath == '':
		basepath = get_config('BOOK_PATH')
	
	fullpath = os.path.normpath(os.path.join(basepath, path))
	
	if os.path.isabs(path):
		raise Exception('Expected relative path')
	
	if os.path.commonprefix([basepath, fullpath]) != basepath:
		raise Exception('Expected path to be a subdirectory of basepath')
	
	return path_to_book(fullpath)

def remove_sep(path, new_sep='--'):
	return path.replace(os.sep, new_sep)
	
def add_sep(path, fake_sep='--'):
	return path.replace(fake_sep, os.sep)

def is_supported_format(file_path):
	name, ext = os.path.splitext(file_path)
	return ext.lower() in COMIC_ARCHIVE_EXTENSIONS and os.path.isfile(file_path)

def is_supported_image(file_name):
	name, ext = os.path.splitext(file_name)
	return ext.lower() in COMIC_IMAGE_EXTENSIONS


class InvalidPageError(IndexError):
	def __init__(self, page=0):
		super(IndexError, self).__init__()
		self.page = page
	

class Comic:
	def __init__(self, path, archive = None):
		self.name = os.path.splitext(os.path.basename(path))[0]
		self.path = path
		self.rel_path = path
		self.current_file_index = -1
		self.archive = archive
		self.file_list = []
		
	def set_rel_path(self, base):
		# Make sure there's a trailing slash.
		base = os.path.join(base, '')
		parts = self.path.rpartition(base)
		self.rel_path = parts[2]
		
	def disp_relpath(self):
		return remove_sep(self.rel_path)
	
	def get_archive(self):
		if not self.archive:
			self.archive = zipfile.ZipFile(self.path, 'r')
		return self.archive
		
	def get_file_list(self):
		if not self.file_list:
			files = self.get_archive().namelist()
			self.file_list = []
			for f in files:
				if is_supported_image(f):
					self.file_list.append(f)
			self.file_list.sort()
		return self.file_list
	
	def next_file(self):
		return self.get_file(self.current_file_index + 1)
	
	def prev_file(self):
		return self.get_file(self.current_file_index - 1)
	
	def get_file(self, index):
		self.current_file_index = index
		try:
			return self.get_archive().read(self.get_file_list()[index])
		except IndexError:
			raise InvalidPageError(index)
	
	def get_file_mime(self, index=-1):
		if index == -1:
			index = self.current_file_index
		try:
			filename = self.get_file_list()[index]
			ext = os.path.splitext(filename)[1]
			for mimetype, extensions in COMIC_IMAGE_MIME_MAP.items():
				if ext in extensions:
					return mimetype
			raise Exception('Unrecognized MIME type')
		except IndexError:
			raise InvalidPageError(index)

	
class ComicLister:
	
	def __init__(self, base_path=''):
		self.base_path = base_path
		
	def get_book_list(self, path=''):
		ret = []
		path = path if path else self.base_path
		for item in os.listdir(path):
			full_path = os.path.join(path, item)
			if os.path.isdir(full_path):
				child_paths = self.get_book_list(full_path)
				ret.extend(child_paths)
			elif is_supported_format(full_path):
				ret.append(full_path)
		return ret
	
	def get_books(self, path=''):
		path = path if path else self.base_path
		ret = []
		for item in self.get_book_list(path):
			c = Comic(item)
			c.set_rel_path(path)
			ret.append(c)
		return ret
