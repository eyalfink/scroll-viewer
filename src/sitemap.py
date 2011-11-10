#! /usr/bin/python2.4
#

import os
import handler

from google.appengine.ext import db
import model

FETCH_LIMIT = 500

class Sitemap(handler.Handler):

  def get(self):
    if os.environ.get('HTTP_HOST'):
      host = os.environ['HTTP_HOST']
    else:
      host = os.environ['SERVER_NAME']

    query = db.GqlQuery('SELECT __key__ FROM Verse order by __key__')

    verses = []
    fetched_verses = query.fetch(FETCH_LIMIT)
    while fetched_verses:
      verses.extend(fetched_verses)
      last_verse = fetched_verses[-1]
      query = db.GqlQuery(
          'SELECT __key__ FROM Verse WHERE __key__ > :1 order by __key__',
          last_verse)
      fetched_verses = query.fetch(FETCH_LIMIT)
    vids = [k.name() for k in verses]
    self.render('templates/sitemap.xml', vids=vids, host=host)


if __name__ == '__main__':
  handler.run([('/sitemap', Sitemap)], debug=True)
