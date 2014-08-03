import os.path
from flask import Flask, request, session, g
from flask.ext.sqlalchemy import SQLAlchemy

BOOK_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'books'))

app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_pyfile('../config.py', silent=True)

db = SQLAlchemy(app)

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
