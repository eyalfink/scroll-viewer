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
