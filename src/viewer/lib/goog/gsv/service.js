/**
 * @author Hovav
 */

goog.provide('gsv.service');

goog.gsv = goog.gsv || {};
goog.gsv.service = goog.gsv.service || {};


// Verse
  goog.gsv.service.Verse = function ()
  {
    this.getShapesByCol = function (col, cback) {
      jQuery.ajax('/api/get_verse_by_column', {data: {col:col.id}, dataType:'json',success:function (res) {
        cback.call(this, res);
      }});
    }

    this.getText = function (id, cback) {
      jQuery.ajax('/api/get_translation', {data: {id:id, lang:'en'}, dataType:'json',success:function (res) {
        cback(res.text);
      }});
    }
  }


