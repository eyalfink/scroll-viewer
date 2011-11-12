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

import simplejson

# our modules
import handler

class WriteShapes(handler.Handler):

  def post(self):
    shapes = simplejson.loads(self.request.body)
    updated = []
    for verse_name, shape in shapes.iteritems():
      verse = self.scrollsDS.GetVerse(verse_name)
      if not verse:
        self.WriteJsonError("can't get verse %s" % verse_name)
        #return
      else:
        if int(shape['c']) != verse.columns[0]:
          if int(shape['c']) == verse.chapter:
            self.WriteJsonError("verse c==chapter %s %s %s" % (
                verse_name, shape['c'], verse.columns[0]))
          else:
            self.WriteJsonError("mismatch column for verse %s %s %s" % (
                verse_name, shape['c'], verse.columns[0]))
        verse.shape = simplejson.dumps(shape)
        updated.append(verse)
    self.scrollsDS.UpdateVerses(updated)


if __name__ == '__main__':
  handler.run([('/api/write_shapes', WriteShapes)], debug=True)
