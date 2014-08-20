#!/usr/bin/env python
import os
import unittest
import tempfile
import linga

try:
	import unittest.mock as mock
except:
	import mock

class LingaTestCase(unittest.TestCase):

	def setUp(self):
		linga.app.config['TESTING'] = True
		self.app = linga.app.test_client()

	def tearDown(self):
		pass
		
	#@mock.patch('linga.comics.os.listdir')
	#@mock.patch('linga.comics.os.path.isfile')
	#def test_should_get_book_list(self, mock_if, mock_ld):
	#	mock_ld.return_value = ['foo.txt', 'bar.jpg', 'test.cbz']
	#	mock_if.return_value = True
	#	res = self.app.get('/books/')
	#	self.assertIn('test.cbz', res.data)
	
	#def test_should_get_expected_data_for_book_page(self):
	#	res = self.app.get('/')

if __name__ == '__main__':
	unittest.main()