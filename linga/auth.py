from datetime import datetime
import werkzeug.security
from flask.ext.login import UserMixin, make_secure_token, login_user, current_user
from linga import app, db, login_manager


login_manager.login_view = 'user_login'

@login_manager.user_loader
def load_user(userid):
	return user_query().filter_by(user_id=userid).first()

@login_manager.token_loader
def load_token(token):
	uid, tok = token.split('|', 1)
	return user_query().filter_by(user_id=int(uid)).first()

def user_query():
	return db.session.query(User)


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
		return unicode(self.user_id)
	
	def get_auth_token(self):
		tok = "%s|%s" % (self.user_id, make_secure_token(str(self.user_id), self.password))
		return unicode(tok)
	
	def check_password(self, password):
		return werkzeug.security.check_password_hash(self.password, password)
	