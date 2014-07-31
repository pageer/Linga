#!/usr/bin/env python
import os
import sys
import unittest
import zipfile

from os.path import dirname

try:
	import unittest.mock as mock
except:
	import mock

sys.path.insert(0, dirname(dirname(dirname(os.path.abspath(__file__)))))

from linga.comics import (ComicLister, Comic, InvalidPageError, is_supported_format,
						  is_supported_image, path_to_book, relpath_to_book,
						  remove_sep, add_sep)

class TestComicLister(unittest.TestCase):
	def setUp(self):
		self.lister = ComicLister()
		self.listdir_returns = [
			['fizz.cbz', 'buzz.txt'],
			['foo.txt', 'bar', 'baz.cbz', 'FIZZ.CBZ']
		]
		self.isfile_dirs = ['bar']
		
	def listdir_side_effect(self, x):
		return self.listdir_returns.pop()
	
	def isdir_side_effect(self, arg):
		return os.path.basename(arg) in self.isfile_dirs
	
	def isfile_side_effect(self, arg):
		return not os.path.basename(arg) in self.isfile_dirs
	
	@mock.patch('linga.comics.os.listdir')
	@mock.patch('linga.comics.os.path.isfile')
	@mock.patch('linga.comics.os.path.isdir')
	def test_should_get_all_cbz_files_under_directory(self, mock_isdir, mock_isfile, mock_listdir):
		
		mock_listdir.side_effect = self.listdir_side_effect
		mock_isfile.side_effect = self.isfile_side_effect
		mock_isdir.side_effect = self.isdir_side_effect
		
		book_list = self.lister.get_book_list('test')
		
		final_paths = [
			os.path.join('test', 'baz.cbz'),
			os.path.join('test', 'FIZZ.CBZ'),
			os.path.join('test', 'bar', 'fizz.cbz')
		]
		for item in final_paths:
			self.assertIn(item, book_list)
	
	@mock.patch('linga.comics.os.listdir')
	@mock.patch('linga.comics.os.path.isfile')
	@mock.patch('linga.comics.os.path.isdir')
	def test_should_get_comics_with_rel_path(self, mock_isdir, mock_isfile, mock_listdir):
		
		mock_listdir.side_effect = self.listdir_side_effect
		mock_isfile.side_effect = self.isfile_side_effect
		mock_isdir.side_effect = self.isdir_side_effect
		
		book_list = self.lister.get_books('test')
		
		rel_paths = [
			os.path.join('bar', 'fizz.cbz'),
			'baz.cbz',
			'FIZZ.CBZ',
		]
		
		self.assertEqual(3, len(book_list))
		for i in range(0, 3):
			self.assertIsInstance(book_list[i], Comic)
			self.assertEqual(book_list[i].rel_path, rel_paths[i])
			
			
class TestComicIsSupportedFile(unittest.TestCase):
	@mock.patch('linga.comics.os.path.isfile')
	def test_should_accept_case_insensitive_cbz(self, mock_isfile):
		mock_isfile.return_value = True
		self.assertFalse(is_supported_format('foo.txt'))
		self.assertFalse(is_supported_format('foo'))
		self.assertTrue(is_supported_format('foo.cbz'))
		self.assertTrue(is_supported_format('FOO.CBZ'))
		mock_isfile.return_value = False
		self.assertFalse(is_supported_format('foo'))
		self.assertFalse(is_supported_format('foo.cbz'))
	
	def test_should_support_jpeg_images(self):
		self.assertTrue(is_supported_image('foo.jpg'))
		self.assertTrue(is_supported_image('BAR.JPG'))
		self.assertTrue(is_supported_image('BAZZ.JPEG'))
		self.assertTrue(is_supported_image('fizz.jpeg'))
	
	
class TestPathToBook(unittest.TestCase):
	
	@mock.patch('linga.comics.os.path.isfile')
	@mock.patch('linga.comics.zipfile.is_zipfile')
	@mock.patch('linga.comics.zipfile.ZipFile')
	def test_should_return_object_for_supported_path(self, mock_zf, mock_zip, mock_isfile):
		mock_isfile.return_value = True
		mock_zip.return_value = True
		self.assertIsInstance(path_to_book('bar.cbz'), Comic)
	
	@mock.patch('linga.comics.os.path.isfile')
	def test_should_raise_error_for_unsupported_path(self, mock_isfile):
		mock_isfile.return_value = True
		self.assertRaises(Exception, path_to_book, 'foo.txt')
	
	
class TestRelpathToBook(unittest.TestCase):
	
	@mock.patch('linga.comics.os.path.isfile')
	@mock.patch('linga.comics.zipfile.is_zipfile')
	@mock.patch('linga.comics.zipfile.ZipFile')
	def test_should_get_object_for_supported_path(self, mock_zf, mock_zip, mock_isfile):
		mock_isfile.return_value = True
		mock_zip.return_value = True
		self.assertIsInstance(relpath_to_book('bar.cbz'), Comic)
		
	@mock.patch('linga.comics.os.path.isfile')
	def test_should_raise_error_for_unsupported_path(self, mock_isfile):
		mock_isfile.return_value = True
		self.assertRaises(Exception, relpath_to_book, 'foo.txt')
		
	def test_should_not_accept_full_path(self):
		test_path = os.path.join(os.getcwd(), 'foo.cbz')
		self.assertRaises(Exception, relpath_to_book, test_path)
	
	def test_should_not_allow_relpath_directory_traversal(self):
		test_path = os.path.join('foo', '..', 'bar.cbz')
		self.assertRaises(Exception, relpath_to_book, test_path)
	

class TestSepFix(unittest.TestCase):
	def test_should_remove_all_seps(self):
		test_path = os.path.join('foo', 'bar', 'baz')
		self.assertEquals(remove_sep(test_path, '*'), 'foo*bar*baz')
	
	def test_should_put_back_sep(self):
		test_path = os.path.join('foo', 'bar', 'baz')
		self.assertEquals(add_sep('foo*bar*baz', '*'), test_path)
		
	def test_should_use_double_dash_as_default(self):
		test_path = os.path.join('foo', 'bar')
		self.assertEquals(add_sep('foo--bar'), test_path)
		self.assertEquals(remove_sep(test_path), 'foo--bar')
	

class TestComic(unittest.TestCase):
	
	def setUp(self):
		self.mock_zip = mock.MagicMock()
		self.mock_zip.namelist.return_value = ['foo/', 'foo/baz.JPG', 'zzz.Jpg', 'asdf.exe', 'bar.jpg', 'fizz.txt']
	
	def test_should_set_name_to_base_path_name(self):
		c = Comic('foo/test.cbz')
		self.assertEquals(c.name, 'test')
		c = Comic('foo.cbz')
		self.assertEquals(c.name, 'foo')
		
	def test_should_convert_multiple_dashes_and_underscores_in_name_to_one_space(self):
		c = Comic('foo/test-bizz--foo__fa_bar.cbz')
		self.assertEquals(c.name, 'test bizz foo fa bar')
	
	def test_should_list_only_supported_files(self):
		c = Comic('test.zip', self.mock_zip)
		files = c.get_file_list()
		self.assertIn('foo/baz.JPG', files)
		self.assertIn('bar.jpg', files)
		self.assertNotIn('fizz.txt', files)
	
	def test_should_sort_returned_files(self):
		c = Comic('test.zip', self.mock_zip)
		files = c.get_file_list()
		self.assertEqual(files, ['bar.jpg', 'foo/baz.JPG', 'zzz.Jpg'])
		
	def test_should_track_current_file_on_navigate(self):
		c = Comic('test.zip', self.mock_zip)
		
		c.get_file(1)
		self.assertEqual(c.current_file_index, 1)
		
		c.prev_file()
		self.assertEqual(c.current_file_index, 0)
		
		c.next_file()
		self.assertEqual(c.current_file_index, 1)
		
		c.get_file(2)
		self.assertEqual(c.current_file_index, 2)
		
	def test_should_raise_on_invalid_page(self):
		c = Comic('test.zip', self.mock_zip)
		
		with self.assertRaises(InvalidPageError):
			c.get_file(5)
		
		with self.assertRaises(InvalidPageError):
			c.prev_file()
		
		with self.assertRaises(InvalidPageError):
			c.get_file(5)
	
	def test_should_set_rel_path_to_path_minus_base(self):
		path = os.path.join('foo', 'bar', 'fizz', 'baz.cbz')
		c = Comic(path)
		c.set_rel_path(os.path.join('foo', 'bar'))
		self.assertEqual(os.path.join('fizz', 'baz.cbz'), c.rel_path)

	def test_should_set_rel_path_to_full_path_on_invalid_base(self):
		path = os.path.join('foo', 'bar', 'fizz', 'baz.cbz')
		c = Comic(path)
		c.set_rel_path(os.path.join('buzz', 'baz'))
		self.assertEqual(path, c.rel_path)
		
	@mock.patch('linga.comics.zipfile.ZipFile')
	def test_should_mime_type_matches_extension(self, mock_zip):
		mock_zip.namelist.return_value = ['bar.png', 'baz.gif', 'buz.jpeg', 'foo.jpg']
		c = Comic('test.cbz', mock_zip)
		self.assertEquals(c.get_file_mime(0), 'image/png')
		self.assertEquals(c.get_file_mime(1), 'image/gif')
		self.assertEquals(c.get_file_mime(2), 'image/jpeg')
		self.assertEquals(c.get_file_mime(3), 'image/jpeg')
	
	
if __name__ == '__main__':
    unittest.main()