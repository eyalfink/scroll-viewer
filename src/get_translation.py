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


""" Answer a verse tanslation """

import json
import handler


class Translation(handler.Handler):

  def get(self):
    vid = self.request.get('id')
    lang = self.request.get('lang') or 'en'
    if vid:
      translation = self.scrollsDS.GetVesreTranslation(vid, lang)
      if not translation:
        self.WriteJsonError("can't get verse %s translation to %s" % (vid, lang))
      else:
        self.WriteJson(translation)
    else:
      self.WriteJsonError('id must be given')

if __name__ == '__main__':
  handler.run([('/api/get_translation', Translation)], debug=True)
