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
