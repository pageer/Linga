from datetime import datetime
import werkzeug.security
from flask_login import UserMixin
from linga import db, login_manager

login_manager.login_view = 'user_login'

@login_manager.user_loader
def load_user(userid):
    return get_user_by_id(userid)

def user_query():
    return db.session.query(User)

def get_user(username):
    return user_query() \
        .filter_by(email=username) \
        .first()

def get_user_by_id(user_id):
    return user_query() \
        .filter_by(user_id=user_id) \
        .first()

class User(db.Model, UserMixin):
    __tablename__ = 'linga_users'

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    created = db.Column(db.DateTime, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    def __init__(self, email='', password=''):
        self.email = email
        self.password = werkzeug.security.generate_password_hash(password)
        self.created = datetime.now()
        self.last_login = None

    def get_id(self):
        return str(self.user_id)

    #def get_auth_token(self):
    #   tok = "%s|%s" % (self.user_id, make_secure_token(str(self.user_id), self.password))
    #   return unicode(tok)

    def check_password(self, password):
        """Validate user password"""
        return werkzeug.security.check_password_hash(self.password, password)
