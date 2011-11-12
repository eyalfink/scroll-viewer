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

"""Access to AppEngine data model."""

from google.appengine.ext import db
import model

MAX_VERSE_PER_COL = 100

class ScrollsDS(object):

  def GetVerse(self, verse_name):
    key = db.Key.from_path('Verse', verse_name)
    verse = db.get(key)
    return verse

  def UpdateVerse(self, verse):
    verse.put()

  def UpdateVerses(self, verses):
    db.put(verses)

  def GetVesreTranslation(self, verse_name, lang):
    key = db.Key.from_path('Verse', verse_name)
    return model.TranslatedVerse.all().filter("verse =", key).filter("lang =", lang).get()

  def GetVersesByCol(self, col):
    return model.Verse.all().filter("columns =", int(col)).fetch(MAX_VERSE_PER_COL)
