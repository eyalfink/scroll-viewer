#! /usr/bin/python2.4
#

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
