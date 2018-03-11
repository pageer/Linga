import os.path
from flask import Flask, request, session, g
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager #, _create_identifier

BOOK_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'books'))
# Make sure to add your own secret key in config.py
SECRET_KEY = "s\xe4\xeb\x9a\xb2\xb4\xd6\xa5-\xca0M'7\xd3\x10oeB\xa1\x11?Yt"
# Environment variable for config file name
ENV_KEY = 'LINGA_CONFIG_FILE'

SQLALCHEMY_TRACK_MODIFICATIONS = False

app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_pyfile(os.environ[ENV_KEY] if os.environ.get(ENV_KEY) else '../config.py', silent=True)

db = SQLAlchemy(app)

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
