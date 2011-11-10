#! /usr/bin/python2.4
#

import handler


class IsaiahPage(handler.Handler):

  def get(self):
    vid = self.request.get('id')
    lang = self.request.get('lang') or 'en'
    params = {}
    if vid:
      verse = self.scrollsDS.GetVesreTranslation(vid, lang)
      if not verse:
        #self.WriteJsonError("can't get verse %s" % vid)
		params['verse'] = "can't get verse %s" % vid
      else:
        params['verse'] = verse.text
    self.render('isaiah.html', **params)


if __name__ == '__main__':
  handler.run([('/isaiah', IsaiahPage)], debug=True)
