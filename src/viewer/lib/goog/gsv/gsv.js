/**
 * Google Scrolls Viewer
 * @author Hovav
 */

goog.provide('goog.gsv');

goog.require('jquery');
goog.require('jquery.ui');
goog.require('jquery.event.drag');
goog.require('jquery.dragscroll');
goog.require('jquery.tmpl');
goog.require('raphael');
goog.require('goog.gsv.mvc');
goog.require('goog.gsv.model');
goog.require('goog.gsv.view');
goog.require('goog.gsv.view.ZoomView');
goog.require('goog.gsv.service');
goog.require('goog.gsv.util');


// namespace:
goog.gsv = goog.gsv || {};


goog.gsv.ScrollViewer = function (jsonURL)
{
  this.jsonURL = jsonURL;
  this.isOpen = false;
  this.created = false;
  this.initVerse = null;

  // preload assets:

  this.preloader = new goog.gsv.util.Loader(4);
  var preloadQueue = [
    "/viewer/images/roller/reflection.png",
    "/viewer/images/roller/shadow-left.png",
    "/viewer/images/roller/shadow-right.png",
    '/viewer/images/roller/texture.jpg',
    '/viewer/images/roller/edge-top.png',
    '/viewer/images/roller/edge-bottom.png',
    '/viewer/images/overlay.png',
    '/viewer/images/close.png',
    '/viewer/images/panel-bg.png',
    '/viewer/images/zoomin_disabled.png',
    '/viewer/images/zoomin.png',
    '/viewer/images/zoomout_disabled.png',
    '/viewer/images/jumpto.png',
    '/viewer/images/jumpto_disabled.png',
    '/viewer/images/zoomout.png',
    '/viewer/images/ruller-bg.png',
    '/viewer/images/nav-thumb-inner.png',
    '/viewer/images/arr-left.png',
    '/viewer/images/arr-right.png',
    '/viewer/images/arr-up.png',
    '/viewer/images/arr-down.png',
    '/viewer/images/detail-close.png',
    '/viewer/images/detail-close-over.png'
  ];

  for (var i = 0; i < preloadQueue.length; i++ )
    this.preloader.addItem(new goog.gsv.util.LoaderItemImage(preloadQueue[i]));

  this.preloader.start();

  // check url for verse id:
  var urlParams = {};
  (function () {
      var e,
          a = /\+/g,  // Regex for replacing addition symbol with a space
          r = /([^&=]+)=?([^&]*)/g,
          d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
          q = window.location.search.substring(1);

      while (e = r.exec(q))
         urlParams[d(e[1])] = d(e[2]);
  })();

  this.initVerse = urlParams['id'];
  if (this.initVerse) this.open();


  // Hack the jQuery step function to allow animating object properties directly.
  var $_fx_step_default = $.fx.step._default;
  $.fx.step._default = function (fx) {
    if (fx.elem.style) return $_fx_step_default(fx);
    if (typeof(fx.elem.set) == 'function')
    {
      var o = {};
      o[fx.prop] = fx.now;
      fx.elem.set(o);
    }
    else
      fx.elem[fx.prop] = fx.now;
    fx.elem.updated = true;
  };
}


goog.gsv.ScrollViewer.prototype.open = function ()
{
  if(this.isOpen) return;
  this.isOpen = true;

  if (!this.created) {
    this.overlay = $('<div class="gsv-overlay" />');
    $('body').append(this.overlay);
    $(this.overlay).click($.proxy(this.close, this));

    // create container:
    // TODO: async
    this.div = $(this.getViewerTemplate());

    $('body').append(this.div);

    // add to page:
    $(this.div).css({
      top: Math.max(10, ($(window).height() - $(this.div).height() ) / 2),
      left: ($(window).width() - $(this.div).width() ) / 2
    });

    this.loadData();
  }
  this.created = true;

  if(this.div)
    $(this.div).show();

  $(this.overlay).show();

  // return this for chaining:
  return this;
}

goog.gsv.ScrollViewer.prototype.close = function ()
{
  if(!this.isOpen) return;
  this.isOpen = false;

  if(this.div)
    $(this.div).hide();

  $(this.overlay).hide();

  // return this for chaining:
  return this;
}

goog.gsv.ScrollViewer.prototype.loadData = function () {

  // load data:
  var service = new goog.gsv.mvc.Service(goog.gsv.model.Scroll);
  $(service).bind('complete', jQuery.proxy(this, 'onDataLoad'));
  service.get(this.jsonURL, {});
}

goog.gsv.ScrollViewer.prototype.onDataLoad = function (evt, res) {
  this.scrollModel = res;
  this.build();
}

goog.gsv.ScrollViewer.prototype.build = function () {

  var inst = this;

  // init verses service:
  this.verseService = new goog.gsv.service.Verse();

  // build views:
  this.headerView = new goog.gsv.view.Header(this.scrollModel, this.div.find('.gsv-header'));
  this.scrollView = new goog.gsv.view.Scroll(this.scrollModel, this.div.find('.gsv-scroll-viewport'));
  this.rullerView = new goog.gsv.view.Ruller(this.scrollModel, this.div.find('.gsv-ruller-viewport'));
  this.navigatorView = new goog.gsv.view.Navigator(this.scrollModel, this.div.find('.gsv-navigator'));
  this.zoomView = new goog.gsv.view.ZoomView(this.scrollModel, this.div.find('.gsv-zoom-view'));
  this.jumpToPanel = new goog.gsv.view.JumpToPanel(this.scrollModel, this.div.find('.gsv-slide-pannel'));


  // rollers:
  if (this.scrollModel.showRollers){
    this.scrollView.$.css({left:15, width:this.scrollView.$.width() - 30});
    this.rullerView.content.css({width:this.rullerView.content.width() + 30});
    this.rollerLeft = new goog.gsv.view.Roller( this.scrollModel );
    $('.gsv-content').append(this.rollerLeft.$);
    this.rollerRight = new goog.gsv.view.Roller( this.scrollModel, 'right' );
    this.rollerRight.$.css({left: this.scrollView.$.width() + 15})
    $('.gsv-content').append(this.rollerRight.$);
  }


  // init viewport:
  var viewport = this.scrollModel.viewport;
  viewport.outer.set({
    width: this.scrollModel.width,
    height: this.scrollModel.height
  });

  // get x of init verse
  if (this.initVerse && this.scrollModel.verses[this.initVerse])
  {
    var v = this.scrollModel.verses[this.initVerse];
    var x = v.column.x + v.column.width/2;
  }


  viewport.inner.set({
    width: this.scrollView.$.width(),
    height: this.scrollView.$.height(),
    x: (x) ? x - this.scrollView.$.width() / 2 : viewport.outer.width - this.scrollView.$.width()
  });


  // prepare popup func in global scope:
  window.openVersionPopup = this.openVersionPopup;
  window.openTermsPopup = this.openTermsPopup;

  // event listeners:

  // resizing:
  $(window).bind( 'hashchange', function(e) {
    inst.setSelectedVerse(window.location.hash.replace("#", ""));
  });

  // hash change:
  $(window).resize( function(e) {
    $(inst.div).css({
      top: Math.max(10, ($(window).height() - $(inst.div).height() ) / 2),
      left: ($(window).width() - $(inst.div).width() ) / 2
    });
  });

  // close button:
  $(this.div).find('.close').click(function(){
    inst.close();
  });

  // verse select:
  $(this.scrollView).bind('select', function (event, id) {
    inst.setSelectedVerse(id);
  })

  // verse hover:
  $(this.scrollView).bind('hover', function (event, id) {
    inst.setHoveredVerse(id);
  })

  // scrolling:
  $(this.scrollModel.viewport.inner).change($.proxy(function(){

    // change proirity of column loading:
    if (this.scrollLoader && this.scrollLoader.loading)
      this.updateLoadOrder();
  }, this));

  // scroll double click sets aoom mode:
  this.scrollView.$.dblclick(function(event){
    if ($(event.target).hasClass('gsv-map-image') || event.target.tagName == "AREA")
    {
      var x = event.layerX || event.offsetX;
      var y = event.layerY || event.offsetY;
      inst.setZoomMode(true, {
        x: x,
        y: y
      });
      inst.updateZoomUI(inst.scrollModel.minZoom);
    }

  });

  // zoom buttons:
  $('.zoomin').click(function (){
    inst.setZoom(inst.scrollModel.zoom + 1);
    inst.updateZoomUI(inst.scrollModel.zoom);
  });

  $('.zoomout').click(function (){
    inst.setZoom(inst.scrollModel.zoom - 1);
    inst.updateZoomUI(inst.scrollModel.zoom);
  });

  // jumpto button:
  $('.jumpto').click(function (event){
    if (inst.jumpToPanel.open)
      inst.closeJumptoView()
    else inst.openJumptoView();

    event.stopPropagation();
  });

  $('.jumpto').mousedown(function (event){
    event.stopPropagation();
  });



  // zoom view - zoom change
  $(this.zoomView).bind('zoom', function (event, value) {
    inst.scrollModel.set({zoom:value});
    inst.updateZoomUI(value);
  });

  // zoom view - bounds change
  $(this.zoomView).bind('bounds', function (event, rect) {
    inst.scrollModel.viewport.inner.set({
      x:rect.x * inst.scrollModel.width,
      width:rect.width * inst.scrollModel.width,
      y:rect.y * inst.scrollModel.height,
      height:rect.height * inst.scrollModel.height
    });
  });

  // thumb dragging to update map:
  $(this.navigatorView).change(function (){
    var rect = inst.scrollModel.viewport.inner;
    var center = {
      x:(rect.x + rect.width/2) / inst.scrollModel.width ,
      y:(rect.y + rect.height/2) / inst.scrollModel.height
    }
    inst.zoomView.setCenterPercent(center);
  });

  // column select:
  $(this.jumpToPanel).bind('col-select', function (event, col) {
    inst.setCenter(col.x + col.width/2);
  });

  // verse select:
  $(this.jumpToPanel).bind('verse-select', function (event, verseId) {
    inst.setSelectedVerse(verseId);
  });


  // media loading:

  if (this.preloader.loading)
  {
    $(this.preloader).bind('complete-all', $.proxy(this.loadColumns, this));
  }
  else
  {
    this.loadColumns();
  }

}


goog.gsv.ScrollViewer.prototype.loadColumns = function ()
{
  this.scrollLoader = new goog.gsv.util.Loader(4);
  var self = this;

  // this.scrollLoader.addItem(new goog.gsv.util.LoaderItemImage(this.scrollModel.legendURL));
  for (var i = this.scrollModel.columns.length - 1; i >= 0; i--)
  {
    var col = this.scrollModel.columns[i];
    col.imageLoader =
      this.scrollLoader.addItem(new goog.gsv.util.LoaderItemImage(col.imageURL, null, col.image));

    if (col.range){
      col.shapesLoader =
        this.scrollLoader.addItem(new goog.gsv.util.LoaderItemJson('/api/get_verse_by_column', jQuery.proxy(function (res) {
           for (var i = 0; i < res.length; i++)
           {
             var v = res[i];
             var id = v.chapter + ":" + v.verse;
             if (v.shape){
               var paths = $.parseJSON (v.shape).p.split('M ').slice(1);
              $.each(paths, function () {
                var area = $('<area shape="poly" style="cursor:pointer; border:none; outline:none"/>');
                area.attr({coords: this, href: "#" + id, border:'0'});
                area.mouseover(function(event){
                  self.setHoveredVerse(this.href.split('#')[1]);
                });
                area.mouseout(function(event){
                  self.setHoveredVerse('');
                });
                area.click(function(event){
                  // areas have anchor href attributes, so by default
                  // the browser will change window.location.hash
                  // if browser doesn't support onhashcange event:
                  var mode = document.documentMode;
                  var is_old_ie = $.browser.msie && ( mode === undefined || mode < 8 );
                  if (!("onhashchange" in window) || is_old_ie) {
                    self.setSelectedVerse(this.href.split('#')[1]);
                  }

                  // remove focus outline on ie:
                  $(area).blur();
                });

                // area.dblclick(function(event){
                  // self.setZoomMode(true, {
                    // x: event.layerX,
                    // y: event.layerY
                  // });
                  // self.updateZoomUI(self.scrollModel.minZoom);
                // });


                $('[name="gsv-map"]').append(area);
              })
               this.scrollModel.verses[id].set({shape: $.parseJSON  (v.shape)});
               if (this.scrollModel.selectedVerse && id == this.scrollModel.selectedVerse.id)
                 this.setSelectedVerse(id);
             }
           }
         }, this), {col:col.id}));
    }
  }


  this.scrollLoader.start();

  if (this.initVerse && this.scrollModel.verses[this.initVerse])
  {
    this.setSelectedVerse(this.initVerse);
  }
}

goog.gsv.ScrollViewer.prototype.updateLoadOrder = function ()
{
  var cx = this.scrollModel.viewport.inner.getCenterX();
  for (var i = 0; i < this.scrollModel.columns.length; i++)
  {
    var col = this.scrollModel.columns[i];
    if (col && !(col.shapesLoader && col.shapesLoader.complete)){
      var priority = Math.abs(cx - col.getCenterX());
      col.imageLoader.priority = priority;
      if (col.shapesLoader) col.shapesLoader.priority = priority;
    }
  }
}



goog.gsv.ScrollViewer.prototype.getViewerTemplate = function () {
  var res;
    jQuery.ajax ('/viewer/templates/viewer.html', {
      async:false,
      success:function(result)
      {
        res = result;
      }
    });

    return res;
}


goog.gsv.ScrollViewer.prototype.loadColShapes = function (col) {
  this.verseService.getShapesByCol(col, jQuery.proxy(function (res) {
     for (var i = 0; i < res.length; i++)
     {
       var v = res[i];
       var id = v.chapter + ":" + v.verse;
       if (v.shape)
         this.scrollModel.verses[id].set({shape: $.parseJSON(v.shape)});
     }
   }, this));
}


goog.gsv.ScrollViewer.prototype.setSelectedVerse = function (id) {
  this.setZoomMode(false);

  // deselect current verse
  if (this.scrollModel.selectedVerse)
    this.scrollModel.selectedVerse.set({selected:false});

  // select new verse
  this.scrollModel.set({
    selectedVerse: this.scrollModel.verses[id]
  });

  var v = this.scrollModel.selectedVerse;

  if (v)
  {
    v.set({selected:true});
    this.setCenter(v.column.x + v.column.width/2);
  }

  this.closeJumptoView();
}

goog.gsv.ScrollViewer.prototype.setHoveredVerse = function (id) {
  // deselect current verse
  if (this.scrollModel.hoveredVerse)
    this.scrollModel.hoveredVerse.set({hovered: false});

  // select new verse
  this.scrollModel.set({
    hoveredVerse: this.scrollModel.verses[id]
  })

  var v = this.scrollModel.hoveredVerse;

  if (v)
  {
    v.set({hovered:true});
  }

  this.closeJumptoView();
}

goog.gsv.ScrollViewer.prototype.setCenter = function (x) {

  this.setZoomMode(false);

  x -= this.scrollModel.viewport.inner.width / 2;
  x = Math.max(Math.min(x, this.scrollModel.width - this.scrollModel.viewport.inner.width),0);
  $(this.scrollModel.viewport.inner).animate({x:x}, 250);
  this.closeJumptoView();
}

goog.gsv.ScrollViewer.prototype.setZoom = function (value) {
  if (value > this.scrollModel.maxZoom)
    return;

  if (value < this.scrollModel.minZoom){
    this.scrollModel.set({zoom:this.scrollModel.minZoom - 1});
    this.setZoomMode(false);
    $('.zoomout').removeClass('gsv-button');
  } else {
    this.scrollModel.set({zoom:value});
    this.zoomView.setZoom(value);
    this.setZoomMode(true);
  }
}

goog.gsv.ScrollViewer.prototype.updateZoomUI = function (value) {
  if (value == this.scrollModel.maxZoom)
    $('.zoomin').removeClass('gsv-button')
  else $('.zoomin').addClass('gsv-button');
  if (value < this.scrollModel.minZoom)
    $('.zoomout').removeClass('gsv-button')
  else $('.zoomout').addClass('gsv-button');


}


goog.gsv.ScrollViewer.prototype.setZoomMode = function (value, center) {
  if (value == true) {
    if (this.zoomView.open) return;
    this.setSelectedVerse(null);
    this.setHoveredVerse(null);
    this.scrollView.hide();
    this.rullerView.hide();
    if (this.scrollModel.showRollers){
      this.rollerRight.hide();
      this.rollerLeft.hide();
    }

    this.scrollModel.set({zoom:this.scrollModel.minZoom});

    // calculate center:
    if (center){
      center.x /= this.scrollModel.width;
      center.y /= this.scrollModel.height;
    }
    else center = {
      x: (this.scrollModel.viewport.inner.x + this.scrollModel.viewport.inner.width/2) / this.scrollModel.width,
      y: 0.5
    }
    this.zoomView.show(center, this.scrollModel.minZoom);
    this.updateZoomUI(this.scrollModel.minZoom);

    this.zoomView.triggerBoundsChange();
  }
  else
  {
    if (!this.zoomView.open) return;
    this.scrollView.show();
    this.rullerView.show();
    if (this.scrollModel.showRollers){
      this.rollerRight.show();
      this.rollerLeft.show();
    }


    var x = this.scrollModel.viewport.inner.width / 2 + this.scrollModel.viewport.inner.x;
    this.scrollModel.viewport.inner.set({
      width: this.scrollView.$.width(),
      height: this.scrollView.$.height(),
      y:0
    })
    x -= this.scrollModel.viewport.inner.width / 2;
    x = Math.max(Math.min(x, this.scrollModel.width - this.scrollModel.viewport.inner.width),0);
    this.scrollModel.viewport.inner.set({x:x});
    this.scrollModel.set({zoom:this.scrollModel.minZoom - 1});
    this.updateZoomUI(this.scrollModel.zoom)
    this.zoomView.hide();
  }
}

goog.gsv.ScrollViewer.prototype.openJumptoView = function () {
  this.jumpToPanel.show();
  $('.jumpto').removeClass('gsv-button');
  $('html, .gsv-navigator div, .gsv-scroll-viewport, .gsv-ruller-viewport div')
  .bind('mousedown', $.proxy (this.closeJumptoView, this));
}

goog.gsv.ScrollViewer.prototype.closeJumptoView = function () {
  this.jumpToPanel.hide();
  $('.jumpto').addClass('gsv-button');
}

goog.gsv.ScrollViewer.prototype.openVersionPopup = function () {
  window.versionPopup = window.open('/version','','height=600,width=1000,scrollbars=yes');
}

goog.gsv.ScrollViewer.prototype.openTermsPopup = function () {
  window.termsPopup = window.open('/terms','','height=600,width=1000,scrollbars=yes');
}



goog.gsv.romanize = function (N)
{
  t=N/1e3|0;N%=1e3;
  for(s=b='',a=5;N;b++,a^=7)
    for(o=N%a,N=N/a^0;o--;)
      s='IVXLCDM'.charAt(o>2?b+N-(N&=~1)+(o=1):b)+s;
  return Array(t+1).join('M')+s;
}


