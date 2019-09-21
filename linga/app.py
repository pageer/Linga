"""Main application initilization."""
import os.path
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

BOOK_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'books'))
# Make sure to add your own secret key in config.py
SECRET_KEY = "s\xe4\xeb\x9a\xb2\xb4\xd6\xa5-\xca0M'7\xd3\x10oeB\xa1\x11?Yt"
# Environment variable for config file name
ENV_KEY = 'LINGA_CONFIG_FILE'
CONFIG_FILE = os.environ[ENV_KEY] if os.environ.get(ENV_KEY) else '../config.py'

SQLALCHEMY_TRACK_MODIFICATIONS = False

app = Flask(__name__) #pylint: disable=invalid-name
app.config.from_object(__name__)
app.config.from_pyfile(CONFIG_FILE, silent=True)

db = SQLAlchemy(app) #pylint: disable=invalid-name

login_manager = LoginManager() #pylint: disable=invalid-name
# Try to accomodate old versions of flask-login
try:
    login_manager.init_app(app)
except Exception as ex: #pylint: disable=broad-except
    login_manager.setup_app(app)


def get_config(key=''):
    """Get a key value from the app config, or the entire config if no key given."""
    if key:
        return app.config[key]
    return app.config


@app.after_request
def after_request(req):
    return req
