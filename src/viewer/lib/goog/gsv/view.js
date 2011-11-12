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

goog.provide('goog.gsv.view');

goog.gsv = goog.gsv || {};
goog.gsv.view = goog.gsv.view || {};


// Header:
  goog.gsv.view.Header = function (scroll, el)
  {
    goog.gsv.mvc.ext(this, goog.gsv.mvc.View, [scroll, el]);

    this.bind('title', function (val) {
      $(el).find('.gsv-title').first().html(val);
    });
  }



// Scroll:
  goog.gsv.view.Scroll = function (scroll, el)
  {
    var view = this;

    var images = $('<div class="gsv-scroll-content-img scrolldrag" />');
    $(el).append(images);

    var canvasDiv = $('<div class="gsv-scroll-content-shape scrolldrag"/>');
    $(el).append(canvasDiv);

    var map = $('<map name="gsv-map" class="scrolldrag draggable"/>').css({
      cursor:"pointer",
      position: "absolute",
      top: 0,
      left: 0
    });
    $(el).append(map);

    var mapImage = $('<img class="gsv-map-image  scrolldrag draggable" usemap="#gsv-map"/>');
    mapImage.attr({
      src: scroll.blackPixelURL,
      width: scroll.width,
      height: scroll.height
    }).css({
      border:"none",
      position: "absolute",
      top: 0,
      left: 0
    });
    $(el).append(mapImage);

    var tip = new goog.gsv.view.VerseTooltip(el);
    var detailtip = new goog.gsv.view.VerseTooltip(el, true);
    $(el).dragscrollable({preventDefault:true, acceptPropagatedEvent:true,dragSelector:'.scrolldrag', allowY:false});

    goog.gsv.mvc.ext(this, goog.gsv.mvc.View, [scroll, el]);

    var dragging = false;
    var active = true;
    var scrollingEndInterval;

    this.show = function () {
      $(el).css({display:'block'});
      active = true;
    }

    this.hide = function () {
      $(el).css({display:'none'});
      active = false;
    }

    // events:

    // mousedown:
    $(el).find('.scrolldrag').bind('mousedown', function(event) {
      dragging = true;
      $(view).trigger('select', null);
      $(el).trigger(event);
    });

    // mouseup:
    $('html').bind('mouseup', function(event) {
      // $(view).trigger('hover', null);
      dragging = false;
    });

    // scroll:
     $(el).scroll(function()
    {
      if (dragging){
        el.scrollTop(0);
        scroll.viewport.inner.set({x: el.scrollLeft()});
      }
    });

    // viewport update:
    $(scroll.viewport.inner).change(function()
    {
      // update scroll
      if (!dragging && active)
        el.scrollLeft(scroll.viewport.inner.x);

    });

    $(detailtip).bind('close', function () {
      $(view).trigger('select', null);
    });

    // load and append images:
    this.bind('columns', function (cols) {
      for ( i = 0; i < cols.length; i++ )
      {
        var img = new Image;
        img.width = cols[i].width;
        img.height = scroll.height;
        $(img).css({
          position: "absolute",
          top:0, left:cols[i].x});

        cols[i].image = img;
        $(images).append(img);
      }
    });


    // prepare canvas:
    if (!jQuery.isEmptyObject(scroll.verses) && typeof Raphael != 'undefined')
    {
      this.canvas = Raphael(canvasDiv[0], scroll.width, scroll.height);

      function drawSelected () {
        undrawSelected();
        view.selectedShape = view.canvas.path(scroll.selectedVerse.shape.p).attr({
          fill: "#bb300c",
          stroke: "#bb300c",
          "fill-opacity": .2,
          "stroke-opacity": .8,
          "stroke-width": 2
        });
      }

      function undrawSelected() {
        if (view.selectedShape)
        {
          view.selectedShape.remove();
          view.selectedShape = null;
        }
      }

      function drawHovered () {
        undrawHovered();
        view.hoveredVerse = view.canvas.path(scroll.hoveredVerse.shape.p).attr({
          fill: "#bb300c",
          stroke: "#bb300c",
          "fill-opacity": .15,
          "stroke-opacity": .3,
          "stroke-width": 2
        });
      }

      function undrawHovered() {
        if (view.hoveredVerse)
        {
          view.hoveredVerse.remove();
          view.hoveredVerse = null;
        }
      }

      // listen to selected verse:
      this.bind('selectedVerse', function (v) {
          if (v) {
            detailtip.hide();
            drawSelected();
            var elbox = view.selectedShape.getBBox();
            var centerHeight = elbox.y + elbox.height / 2;
            var pos = (centerHeight > scroll.height / 2) ? 'top' : 'bottom';

            if (v.text){
              detailtip.show(view.selectedShape, v, pos);
            }
            else
            {
              new goog.gsv.service.Verse().getText(v.id, function (res) {
                  v.text = res;
                  if (!detailtip.opened)
                    detailtip.show(view.selectedShape, v, pos);
              });
            }

          }
          else {
            detailtip.hide();
            undrawSelected();
          }
        });


      // listen to hovered verse:
      this.bind('hoveredVerse', function (v) {
          if (v) {
            drawHovered();
            var elbox = view.hoveredVerse.getBBox();
            var centerHeight = elbox.y + elbox.height / 2;
            var pos = (centerHeight > scroll.height / 2) ? 'top' : 'bottom';
            tip.show(view.hoveredVerse, v, pos);
          }
          else {
            tip.hide();
            undrawHovered();
          }
        });
    }


    this.bind('width', function (width) {
      $(images).width(width);
    });

  }

// Roller:
  goog.gsv.view.Roller = function (scroll, side)
  {
    var el = $(getTemplateAsync ());
    var maxWidth = 60;
    var minWidth = 10;
    var range = maxWidth - minWidth;

    goog.gsv.mvc.ext(this, goog.gsv.mvc.View, [scroll, el]);

    var dir = (side == 'right') ? -1 : 1;

    el.bind('mousedown', onMouseEvnt);
    el.bind('mouseup', onMouseEvnt);
    $(scroll.viewport.inner).change(update);

    var active = true;

    this.show = function () {
      $(el).css({display:'block'});
      active = true;
    }

    this.hide = function () {
      $(el).css({display:'none'});
      active = false;
    }


    function onMouseEvnt (event) {
      event.preventDefault();
    }

    function update () {

      if (!active) return;

      var percent = scroll.viewport.inner.x / scroll.width;
      if (dir == -1)
      {
        percent = 1 - (scroll.viewport.inner.x + scroll.viewport.inner.width) / scroll.width;
      }
      var w = minWidth + range * percent;

      if (w < minWidth + .25)
      {
        var op = (w - minWidth)*4;
        el.css({
          opacity:op,
          filter: 'alpha(opacity=' + op*100 + ')',
          visibility: (op > 0) ? 'visible' : 'hidden'
        });
      }
      else el.css({
        opacity:1,
        filter: 'alpha(opacity=100)',
        visibility: 'visible'
      });

      w = Math.round(w);

      el.find(".scrollable").each(function (){
        $(this).css('background-position', scroll.viewport.inner.x);
      });

      el.width(w);
      var sw = Math.round(26 * percent + 6);
      el.find(".shadow").width(sw);
      el.find(".shadow.left").css('left', sw * -1);
      if(dir == -1) el.css('margin-left', -w);

    }

    function getTemplateAsync () {
      var res;
        jQuery.ajax ('/viewer/templates/roller.html', {
          async:false,
          success:function(result)
          {
            res = result;
          }
        });
        return res;
    }

  }


// Ruller:
  goog.gsv.view.Ruller = function (scroll, el)
  {
    var numbers = this.content = $('<div class="gsv-ruller-content" />');
    $(el).append(numbers);


    goog.gsv.mvc.ext(this, goog.gsv.mvc.View, [scroll, el]);

    var dragging = false;
    var active = true;

    this.show = function () {
      $(el).css({display:'block'});
      active = true;
    }

    this.hide = function () {
      $(el).css({display:'none'});
      active = false;
    }

    // dragging cancelled because of a zoom out bug

    //
    // $(el).dragscrollable();

    // $(el).bind('mousedown', function(event) {
      // dragging = true;
    // });

    // $(el).bind('mouseup', function(event) {
      // dragging = false;
    // });

     // $(el).scroll(function()
    // {
      // scroll.viewport.inner.set({x: el.scrollLeft()});
    // });

    // prevent text selection
    $(el).bind('mousedown', function(event) {
      event.preventDefault();
    });

    // viewport update:
    $(scroll.viewport.inner).change(function()
    {
      if (!dragging && active)
        el.scrollLeft(scroll.viewport.inner.x);
    });


    this.bind('columns', function (cols) {
      for ( i = 0; i < cols.length; i++ )
      {
        var div = document.createElement('div');
        $(div).css('position', 'absolute');
        $(div).html(formatColnum (cols[i]));
        $(div).css({top:0, left:cols[i].x, width:cols[i].width, "text-align":'center'});
        $(numbers).append(div);
      }
    });

    this.bind('width', function (width) {
      $(numbers).width(width);
    });

    $(scroll.viewport.inner).change(function()
    {
      el.scrollLeft(scroll.viewport.inner.x);
    });

    function formatColnum (col) {
       return "<b>Col " + goog.gsv.romanize(col.id) +
         ((col.range) ? " - </b>" + scroll.id + "." + col.range : " (" + col.id + ")</b>");
    }

  }

// Navigator:
  goog.gsv.view.Navigator = function (scroll, el)
  {
    // ratio between scroll size and thumb size
    var scale = scroll.legendScale || 0.058333;
    var container = $('<div class="gsv-navigator-content"/>');
    var image = $('<img class="gsv-navigator-img" />');
    var numbers = $('<div class="gsv-navigator-numbers-container" />');
    var thumb = $('<div class="gsv-navigator-thumb" />');
    var thumbArrows = {
      left:$('<div class="gsv-navigator-thumb-arr-left" />'),
      right:$('<div class="gsv-navigator-thumb-arr-right" />')
      // up:$('<div class="gsv-navigator-thumb-arr-up" />'),
      // down:$('<div class="gsv-navigator-thumb-arr-down" />')
    };

    if ( scale < 0.05)
      el.css({'margin-top': 14})

    el.append(container)
    container.append(
      image,
      numbers,
      thumb,
      // thumbArrows.up,
      // thumbArrows.down,
      thumbArrows.right,
      thumbArrows.left
      );

    var view = this;

    goog.gsv.mvc.ext(this, goog.gsv.mvc.View, [scroll, el]);

    this.bind('legendURL', function (url) {
      image.attr('src', url);
    });

    this.bind('columns', function (cols) {
      for ( i = 0; i < cols.length; i++ )
      {
        var div = $('<div class="gsv-navigator-number"/>');
        div.html(cols[i].id);
        div.css('left', (cols[i].x + cols[i].width/2) * scale - div.width()/2);
        div.css('top', (scroll.height * scale - div.height())/2 - 5);

        $(numbers).append(div);

        if ( scale < 0.05) i += 1;
      }
    });

    this.bind('width', function (width) {
      el.width(width * scale);
    });

    var dragging = false;

    $(scroll.viewport.inner).change(function()
    {
      var width = Math.round(scroll.viewport.inner.width*scale);
      var height = Math.round(scroll.viewport.inner.height*scale);
      var top = Math.round(scroll.viewport.inner.y*scale);
      var left = Math.round(scroll.viewport.inner.x*scale);
      // update thumb:
      thumb.css({
        left:scroll.viewport.inner.x*scale,
        top:scroll.viewport.inner.y*scale
        });
      thumb.width(width);
      thumb.height(height);

      // update arrows:
      var pad = 4;

      // dont show arrows in zoom mode
      var show = (height >= scroll.height*scale);
      if (!show) {
        $(thumbArrows.left).hide();
        $(thumbArrows.right).hide();
      }
      else
      {
        // thumbArrows.up.css({
          // top: top - pad - thumbArrows.up.height(),
          // left: left,
          // width:width,
          // display: (top - pad - thumbArrows.up.height() < 0) ? 'none' : 'block'
        // });
  //
        // thumbArrows.down.css({
          // top: top + height + pad*2,
          // left: left,
          // width:width,
          // display: (top + height + pad*2 + thumbArrows.down.height() > scroll.height*scale) ? 'none' : 'block'
        // });

        thumbArrows.left.css({
          top: top,
          left: left - pad - thumbArrows.left.width(),
          height:height,
          display: (left - pad - thumbArrows.left.width() < 0) ? 'none' : 'block'
        });

        thumbArrows.right.css({
          top: top,
          left: left + width + pad*2,
          height:height,
          display: (left + width + pad*2 + thumbArrows.right.width() > scroll.width*scale) ? 'none' : 'block'
        });
      }

    });


    container.drag(function (event, dd) {
      var x = event.pageX - container.offset().left;
      var y = event.pageY - container.offset().top;
      scroll.viewport.inner.set({
        x: Math.max(0, Math.min(( x - thumb.width()/2 )/ scale,scroll.viewport.outer.width - scroll.viewport.inner.width)),
        y: Math.max(0, Math.min(( y - thumb.height()/2 )/ scale,scroll.viewport.outer.height - scroll.viewport.inner.height))});

      triggerChange();
    });


    container.bind('mousedown', function (event, dd) {
      var x = event.pageX - container.offset().left;
      var y = event.pageY - container.offset().top;
      x = Math.max(0, Math.min(( x - thumb.width()/2 )/ scale,scroll.viewport.outer.width - scroll.viewport.inner.width));
      y = Math.max(0, Math.min(( y - thumb.height()/2 )/ scale,scroll.viewport.outer.height - scroll.viewport.inner.height));

      if (event.target == thumb[0]){
        scroll.viewport.inner.set({x: x, y: y})
        triggerChange();
      }
      else $(scroll.viewport.inner).animate({x:x, y:y}, {duration:150, step:triggerChange})
    });


    function triggerChange () {
      $(view).change();
    }

  }

// tooltip:
  goog.gsv.view.VerseTooltip = function (parent, isDetail) {
    var classes = 'gsv-tooltip' + ((isDetail) ? ' gsv-verse-detail' : '');
    var template = isDetail ?
      "<div class='gsv-button close' />" +
      "<b>Chapter ${c} : Verse ${v}</b>" +
      "<p>${text}</p>" :
      "<b>Chapter ${c} : Verse ${v}</b>";

    this.pad = 10;
    this.opened = false;
    var tip = this.$ = $(document.createElement('div'))
                     .addClass(classes);

       $(parent || 'body').append(tip);

    this.show = function (shape, content, pos) {
      if (!shape) return;
      this.opened = true;
      tip.css({ display:'none' });
      // get el bounding box:
      this.elbox = shape.getBBox();
      this.pos = pos;
      tip.html($.tmpl(template, content));
      this.updateContent(content);
      tip.fadeIn('fast');
    };

    this.updateContent = function (content){
      tip.html($.tmpl(template, content));
      var posX = this.elbox.x + (this.elbox.width - tip.outerWidth())/2;
      var posY = (!this.pos || this.pos == 'top') ? this.elbox.y - tip.outerHeight() - this.pad : this.elbox.y + this.elbox.height + this.pad;
      tip.css({ left: posX, top: posY });

      tip.find('.close').click($.proxy(function (){
        $(this).trigger('close');
      }, this));
    }

    this.hide = function () {
      this.opened = false;
      tip.css({ display:'none' });
    };
  }

// tooltip:
  goog.gsv.view.JumpToPanel = function (scroll, el) {

    var view = this;
    goog.gsv.mvc.ext(this, goog.gsv.mvc.View, [scroll, el]);

    var colsInput = $(el).find(".col-select input" ).first();
    var chapsInput = $(el).find(".chap-select input" ).first();
    var verseInput = $(el).find(".verse-select input" ).first();

    if (!scroll.chaps){
      $(el).find('.separator, .colon, .chap-select, .verse-select').hide();
    }

    this.open = false;

    this.hide = function (){
      if (!view.open) return;
      $(el).hide();
      view.open = false;
      $('.ui-autocomplete').hide();
    }

    // todo: fix position
    this.show = function (){
      if (view.open) return;

      var pos = $(el).parent().find('.right').position();
      pos.left -= $(el).outerWidth();
      $(el).css({left:pos.left});
      $(el).show();
      $( chapsInput ).val('');
      $( verseInput ).val('');
      $( colsInput ).val('').focus().select();
      view.open = true;

      $(el).bind('mousedown', clickHandler);
    }

    function clickHandler (event) {
      event.stopPropagation();
    }

    /// setup:


    $( colsInput ).focus(function (){
      $(this).autocomplete('search','');
    });

    $( chapsInput ).focus(function (){
      $(this).autocomplete('search','');
    });

    $( verseInput ).focus(function (){
      setupVerses();
      $(verseInput).autocomplete('search','');
    });


    // colls autoselect:
    $( colsInput ).autocomplete({
      minLength: 0,
      source: scroll.columns,
      select: function(event, ui) {
        $(view).trigger('col-select', ui.item);
        $( colsInput ).val( goog.gsv.romanize(ui.item.id) + " (" + ui.item.id +")" );
      },
      focus: function( event, ui ) {
        $( colsInput ).val( goog.gsv.romanize(ui.item.id) + " (" + ui.item.id +")" );
        return false;
      },
      position: { my : "left bottom", at: "left top", offset:"-16 -14" },
      open: function() {
        $('.ui-autocomplete').bind('mousedown', clickHandler);
        $('.ui-autocomplete').width(88);
      }
    })
    .data( "autocomplete" )._renderItem = function( ul, item ) {
      return $( "<li></li>" )
        .data( "item.autocomplete", item )
        .append( "<a><div class='left'>" + goog.gsv.romanize(item.id) +
        "</div><div class='right'>(" + item.id +
        ")</div><div class='clear' /></a>" )
        .appendTo( ul );
    };

    // handle enter key
    $(colsInput).bind('keypress', function(e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13) {
        var col = $.grep(scroll.columns, function (a) {
          return a.id == $(colsInput).val() ||
          goog.gsv.romanize(a.id).toLowerCase() == $(colsInput).val().toLowerCase();
        })[0];
        if (col)
          $(view).trigger('col-select', col);
      }
    });


    if (scroll.verses){

      var chaps = [];
      for (var i = 1; i <= scroll.numChapters; i++)
        chaps.push(String(i));

      // colls autoselect:
      $( chapsInput ).autocomplete({
        minLength: 0,
        source: chaps,
        select: function(event, ui) {
          $( verseInput ).val('').focus();
        },
        focus: function( event, ui ) {
          $( chapsInput ).val( ui.item.label );
          return false;
        },
        position: { my : "left bottom", at: "left top", offset:"0 -14" },
        open: function() {
          $('.ui-autocomplete').bind('mousedown', clickHandler);
          $('.ui-autocomplete').width(70);
        }
      });

      // handle enter key
      $(chapsInput).bind('keypress', function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if(code == 13) {
          if (Number($(chapsInput).val()) < chaps.length)
            $( verseInput ).val('').focus();
        }
      });


      // verses autoselect:
      $( verseInput ).autocomplete({
        minLength: 0,
        focus: function( event, ui ) {
          $( verseInput ).val( ui.item.label );
          return false;
        },
        position: { my : "left bottom", at: "left top", offset:"-44 -14" },
        open: function() {
          $('.ui-autocomplete').bind('mousedown', clickHandler);
          $('.ui-autocomplete').width(70);
        }
      });

    }

    function setupVerses () {
      var chap = Number($(chapsInput).val());
      var vss = [];
      for (var i = 1; i <= scroll.chaps[chap-1]; i++)
        vss.push(String(i));

      $( verseInput ).autocomplete("option", {
        source:  vss,
        select: function(event, ui) {
          selectVerse(chap + ":" + ui.item.label);

          // if browser doesn't support onhashcange event:
          var mode = document.documentMode;
          var is_old_ie = $.browser.msie && ( mode === undefined || mode < 8 );
          if (!("onhashchange" in window) || is_old_ie) {
             $(view).trigger('select', chap + ":" + ui.item.label);
          }
        }
      })
      .data( "autocomplete" )._renderItem = function( ul, item ) {
      return $( "<li></li>" )
        .data( "item.autocomplete", item )
        .append( "<a><span class='grey'>" + chap +
        ":</span>" + item.label + "</a>" )
        .appendTo( ul );
      };

      // handle enter key
      $(verseInput).unbind('keypress');
      $(verseInput).bind('keypress', function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if(code == 13) {
          selectVerse(chap + ":" + $(verseInput).val());
        }
      });
    }

    function selectVerse (id) {
      window.location.hash = id;

      // if browser doesn't support onhashcange event:
      var mode = document.documentMode;
      var is_old_ie = $.browser.msie && ( mode === undefined || mode < 8 );
      if (!("onhashchange" in window) || is_old_ie) {
         $(view).trigger('select', id);
      }
    }





  }
