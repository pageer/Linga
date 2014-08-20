import os.path
from flask import Flask, request, session, g
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager, _create_identifier

BOOK_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'books'))
# Make sure to add your own secret key in config.py
SECRET_KEY = "s\xe4\xeb\x9a\xb2\xb4\xd6\xa5-\xca0M'7\xd3\x10oeB\xa1\x11?Yt"

app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_pyfile('../config.py', silent=True)

db = SQLAlchemy(app)
db.create_all()

login_manager = LoginManager()
# Try to accomodate old versions of flask-login
try:
    login_manager.init_app(app)
except:
    login_manager.setup_app(app)


def get_app():
    return app

def get_config(key=''):
    if key:
        return app.config[key]
    else:
        return app.config

def get_db():
    return db

@app.after_request
def after_request(req):
    return req
