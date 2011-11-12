// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @author Hovav
 */

goog.provide('gsv.model');

goog.gsv = goog.gsv || {};
goog.gsv.model = goog.gsv.model || {};



// Rect:
  goog.gsv.model.Rect = function  ()
  {
    goog.gsv.mvc.ext(this, goog.gsv.mvc.Model);

    this.set({
      x:0,
      y:0,
      width:0,
      height:0
    });

    this.getCenterX = function () {
      return this.x + this.width/2;
    }
  }



// Viewport:
  goog.gsv.model.Viewport = function  ()
  {
    goog.gsv.mvc.ext(this, goog.gsv.mvc.Model);

    this.set({
      inner: new goog.gsv.model.Rect,
      outer: new goog.gsv.model.Rect,
      zoomLevel: 0
    });

  }



// Scroll:
  goog.gsv.model.Scroll = function  ()
  {
    goog.gsv.mvc.ext(this, goog.gsv.mvc.Model);

    this.set({
      id:'ID',
      title:'TITLE',
      width:0,
      height:0,
      legendURL: '',
      columns: [],
      viewport: new goog.gsv.model.Viewport,
      verses: {},
      showRollers: false,
      selectedVerse: null,
      hoveredVerse: null,
      tilePrefix: null,
      tileSize: null,
      maxZoom:null,
      minZoom:null,
      zoom:null,
      fullSize:null
    });

    this.preProcess = function (obj) {
      if (obj.columns)
      {
        obj.verses = {};

        for (var i = 0; i < obj.columns.length; i++ )
        {
          var o = obj.columns[i];
          var n = new goog.gsv.model.Column;

          for (var key in o)
          {
            n[key] = o[key];
          }

          // label field for autocomplete""
          n.label = goog.gsv.romanize(n.id) + " (" + n.id +")";

          obj.columns[i] = n;

          // parse verses range fo col
          if (obj.columns[i].range)
          {
            var a = obj.columns[i].range.split("-");
            var frm = a[0].split(":");
            var too = a[1].split(":");
            if (too.length == 1) too.unshift(frm[0]);
            for (cp = Number(frm[0]); cp <= Number(too[0]); cp ++)
            {
              if (cp == Number(frm[0]))
                for (vs = Number(frm[1]); vs <= obj.chaps[Number(cp-1)]; vs ++)
                  obj.verses[cp+":"+vs] = new goog.gsv.model.Verse(cp+":"+vs, n);
              else if (cp == Number(too[0]))
                for (vs = 1; vs <= Number(too[1]); vs ++)
                  obj.verses[cp+":"+vs] = new goog.gsv.model.Verse(cp+":"+vs, n);
              else
                for (vs = 1; vs <= Number(obj.chaps[cp-1]); vs ++)
                  obj.verses[cp+":"+vs] = new goog.gsv.model.Verse(cp+":"+vs, n);
            }
          }
        }

      }
    }
  }



// Column:
  goog.gsv.model.Column = function  ()
  {
    goog.gsv.mvc.ext(this, goog.gsv.mvc.Model);

    this.set({
      id:'ID',
      x:0,
      y:0,
      width:0,
      imageURL: '',
      image:null,
      visible: false,
      verses: []
    });

    this.getCenterX = function () {
      return this.x + this.width/2;
    }
  }



// Verse:
  goog.gsv.model.Verse = function  (id, col)
  {
    goog.gsv.mvc.ext(this, goog.gsv.mvc.Model);
    var inst = this;

    this.set({
      id: id,
      c: id.split(":")[0],
      v: id.split(":")[1],
      selected: false,
      hovered: false,
      column: col,
      shape: 0,
      text: null
    });

    col.verses.push(this);

    this.render = function ()
    {
      if (inst.el){
              try{
                inst.el.attr({path:inst.shape.p})
            } catch (e){};
          }
    }

    this.unrender = function ()
    {
      if (inst.el){
        try{
                inst.el.attr({path:''})
        } catch(e){};
          }
    }
  }
