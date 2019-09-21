#!/usr/bin/env python

#pylint: disable=missing-docstring,invalid-name,bare-except,wrong-import-position,import-error
import sys
from os.path import dirname, abspath
from datetime import datetime
import unittest

sys.path.insert(0, dirname(dirname(dirname(abspath(__file__)))))

from linga import app, db, User
from linga.auth import user_query


class TestUser(unittest.TestCase):
    def setUp(self):
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tmp.db'
        db.init_app(app)
        db.create_all()

    def tearDown(self):
        db.drop_all()

    def test_should_accept_email_on_create(self):
        u = User('foo@bar.com')
        self.assertEquals(u.email, 'foo@bar.com')

    def test_should_hash_password_on_create(self):
        u = User('foo@bar.com', 'Password1')
        self.assertGreaterEqual(len(u.password), len('Password1'))
        self.assertNotEquals(u.password, 'Password1')

    def test_should_validate_password_set_on_create(self):
        u = User('foo@bar.com', 'Password1')
        self.assertTrue(u.check_password('Password1'))

    def test_should_set_created_date_on_create(self):
        u = User('foo@bar.com', 'Password1')
        cur_time = datetime.now()
        self.assertIsNotNone(u.created)
        self.assertGreaterEqual(cur_time, u.created)

    def test_should_persist_new_user(self):
        u = User('foo@bar.com', 'Password1')
        db.session.add(u)
        db.session.commit()
        users = user_query().filter_by(email='foo@bar.com').all()
        self.assertEqual(len(users), 1)
        self.assertEqual(users[0].email, 'foo@bar.com')
        self.assertTrue(users[0].check_password('Password1'))

    def test_should_persist_changes(self):
        u = User('foo@bar.com', 'Password1')
        db.session.add(u)
        db.session.commit()
        u.email = 'bob@foo.com'
        db.session.add(u)
        db.session.commit()
        users = user_query().all()
        self.assertEquals(len(users), 1)
        self.assertEquals(users[0].email, 'bob@foo.com')
