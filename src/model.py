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

"""AppEngine data model."""

from google.appengine.ext import db


class Verse(db.Model):
  chapter = db.IntegerProperty()
  verse = db.IntegerProperty()
  columns = db.ListProperty(int)
  shape = db.StringProperty() # json string of the verse polygon


class TranslatedVerse(db.Model):
  verse = db.ReferenceProperty()
  lang = db.StringProperty(default='en')
  text = db.TextProperty()
