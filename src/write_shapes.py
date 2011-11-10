#! /usr/bin/python2.4
#

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
