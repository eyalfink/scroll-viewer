#!/usr/bin/python
# Copyright 2011 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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
