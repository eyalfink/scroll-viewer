#! /usr/bin/python2.4
#

import json
import handler


class VerseById(handler.Handler):

  def get(self):
    vid = self.request.get('id')
    if vid:
      verse = self.scrollsDS.GetVerse(vid)
      if not verse:
        self.WriteJsonError("can't get verse %s" % vid)
      else:
        self.WriteJson(verse)
    else:
      self.WriteJsonError('id must be given')

class VerseByCol(handler.Handler):

  def get(self):
    col = self.request.get('col')
    if col:
      verse = self.scrollsDS.GetVersesByCol(col)
      if not verse:
        self.WriteJsonError("can't get verses for %s" % col)
      else:
        self.WriteJson(verse)
    else:
      self.WriteJsonError('col must be given')


if __name__ == '__main__':
  handler.run([('/api/get_verse', VerseById),
               ('/api/get_verse_by_column', VerseByCol)], debug=True)
