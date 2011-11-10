#! /usr/bin/python2.4
#

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
