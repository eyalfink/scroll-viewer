#! /usr/bin/python2.4
#

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
