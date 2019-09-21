#!/usr/bin/env python
import os
import sys
from os.path import dirname, abspath

sys.path.insert(0, dirname(dirname(dirname(abspath(__file__)))))

import unittest
import tempfile
import linga
import flask_login

from linga.comics import ComicMetadata
from linga import User

try:
    import unittest.mock as mock
except:
    import mock


class LingaTestCase(unittest.TestCase):

    def setUp(self):
        linga.app.config['TESTING'] = True
        linga.app.login_manager.init_app(linga.app)
        self.app = linga.app.test_client()

    def tearDown(self):
        pass
        
    @mock.patch('linga.comics.os.listdir')
    @mock.patch('linga.comics.os.path.isfile')
    @mock.patch('linga.views.get_recent_books')
    @mock.patch('flask_login.utils._get_user')
    def test_when_a_book_exists_it_should_appear_in_book_list(self, curr_user, db_query, isfile, listdir):
        listdir.return_value = ['foo.txt', 'bar.jpg', 'test.cbz']
        isfile.return_value = True
        curr_user.return_value = User()
        db_query.return_value = None

        with self.app:
            res = self.app.get('/books/')

            self.assertIn('test.cbz', res.data)
    
    @mock.patch('linga.views.get_book')
    @mock.patch('flask_login.utils._get_user')
    @mock.patch('linga.app.logger.error')
    def test_when_requested_book_does_not_exist_should_log_and_404(self,logger, curr_user, get_book):
        get_book.side_effect = Exception('does not exist')
        curr_user.return_value = User(123)

        with self.app:
            res = self.app.get('/books/read/test.cbz/')
            print res.__dict__

        assert logger.called_with('does not exist')
        assert res.status_code == 404, "Expected 404 respose"


if __name__ == '__main__':
    unittest.main()
