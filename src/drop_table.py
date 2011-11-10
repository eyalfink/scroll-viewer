#! /usr/bin/python2.4
#

"""Delete all objects.
We could it make it faster with mapreduce
(http://code.google.com/p/appengine-mapreduce/wiki/GettingStartedInPython) if needed

"""
import time
from google.appengine.ext import db

import handler


class BulkDelete(handler.Handler):

  def get(self):
    self.response.out.write('<html><body><form method="post">\n')
    self.response.out.write('Entity to delete <input type="text" name="entity"/>\n')
    self.response.out.write('<input type="submit" value="Delete" />\n')
    self.response.out.write('</form></body></html>\n')

  def post(self):
    self.response.headers['Content-Type'] = 'text/plain'
    entity = self.request.get('entity')
    try:
      while True:
        q = db.GqlQuery("SELECT __key__ FROM %s" % entity)
        if not q.count():
          self.response.out.write('Done')
          break;
        db.delete(q.fetch(200))
        time.sleep(1)
    except Exception, e:
      self.response.out.write(repr(e)+'\n')
      pass


if __name__ == '__main__':
  handler.run([('/api/drop_table', BulkDelete)], debug=True)
