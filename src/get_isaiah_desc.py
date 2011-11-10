#! /usr/bin/python2.4
#

import handler


class GetIsaiahDesc(handler.Handler):

  def get(self):
    self.render('isaiah_desc.html')

if __name__ == '__main__':
  handler.run([('/api/get_isaiah_desc', GetIsaiahDesc)], debug=True)
