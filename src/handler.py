#! /usr/bin/python2.4
#

import os

from google.appengine.ext import webapp
import google.appengine.ext.webapp.template
import google.appengine.ext.webapp.util

import data_store
import json

ROOT = os.path.dirname(__file__)

class Handler(webapp.RequestHandler):
  def __init__(self):
    self.scrollsDS = data_store.ScrollsDS()

  def render(self, path, **params):
    """Renders the template at the given path with the given parameters."""
    self.write(webapp.template.render(os.path.join(ROOT, path), params))

  def write(self, text):
    self.response.out.write(text)

  def WriteJson(self, reply):
    self.response.out.write(json.encode(reply))

  def WriteJsonError(self, msg):
    self.response.out.write(json.encode({'fail': True,
                                         'msg': msg}) + '\n')

def run(*args, **kwargs):
  webapp.util.run_wsgi_app(webapp.WSGIApplication(*args, **kwargs))
