#!/usr/bin/env python

#activate_this = '/home/skepticats/www/www/linga/venv/bin/activate_this.py'
#execfile(activate_this, dict(__file__=activate_this))

from wsgiref.handlers import CGIHandler
from linga import app, views

class PathStrip(object):
    def __init__(self, app):
        self.app = app
    def __call__(self, environ, start_response):
        script_name = 'runcgi.py'
        sn_val = environ['SCRIPT_NAME']
        environ['SCRIPT_NAME'] = sn_val.replace(script_name, '')
        pi_val = environ['PATH_INFO']
        script_name_pos = pi_val.find(script_name)
        if script_name_pos >= 0:
            environ['PATH_INFO'] = pi_val[(script_name_pos + len(script_name)):]
        return self.app(environ, start_response)
            
app.wsgi_app = PathStrip(app.wsgi_app)

CGIHandler().run(app)

