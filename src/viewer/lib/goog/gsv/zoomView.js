/**
 * @author Hovav
 */

goog.provide('goog.gsv.view.ZoomView');

goog.gsv = goog.gsv || {};
goog.gsv.view = goog.gsv.view || {};

// Zoom View:
  goog.gsv.view.ZoomView = function (scroll, el)
  {
    goog.gsv.mvc.ext(this, goog.gsv.mvc.View, [scroll, el]);

    var init = false;
    var active = false;
    var view = this;
    var initCenter;
    var initZoom;
    scroll.zoom = scroll.minZoom - 1;


    this.show = function (center, zoom) {
      el.css({display:'block'});
      active = true;
      view.open = true;
      initCenter = center;
      initZoom = zoom;
      if (!init)
      {
        view.init();
        init = true;
      }
      else
      {
        if (initCenter)
          view.setCenterPercent(initCenter);
        initCenter = null;

        if (initZoom)
          view.setZoom(initZoom);
        initZoom = null;
      }
    }

    this.hide = function () {
      el.css({display:'none'});
      view.open = false;
      active = false;
    }

    this.init = function () {
      //set global callback for maps api load complete
      window.gsvMapsAPIInit = initialize;
      loadScript();
    }

    this.setZoom = function (zoom) {
      if (active) map.setZoom(zoom);
    }

    this.setCenterPercent = function (center) {
      if (active){
        map.setCenter(gpointToLatLng(percentToGPoint(center)));
      };
    }

    this.triggerBoundsChange = function() {
      try {
        var rect = limit();
        $(view).trigger('bounds', rect);
      } catch (e)  {}
    }

    this.hide();

    var map;
    var tileSize = scroll.tileSize;
    var maxZoom = scroll.maxZoom;
    var minZoom = scroll.minZoom;
    var viewSize;
    var fullSize = scroll.fullSize;
    var tilePrefix = scroll.tilePrefix;
    var blackPixelURL = scroll.blackPixelURL;
    var type;

    function initialize() {

      viewSize = {w:el.width(), h:el.height()}

      var mapOptions = {
         getTileUrl: function(coord, zoom) {
           if(zoom > maxZoom || coord.x < 0 || coord.y < 0 )
           return blackPixelURL;

            return tilePrefix +
              zoom + '_' + coord.x + '_' + coord.y + '.jpg';
          },
        tileSize: new google.maps.Size(tileSize, tileSize),
        zoom: minZoom,
        maxZoom:maxZoom,
        minZoom:minZoom
      };

      type = new google.maps.ImageMapType(mapOptions);

      map = new google.maps.Map(el.find('.gsv-map-container')[0], {
        tileSize: new google.maps.Size(tileSize, tileSize),
        zoom: minZoom,
        disableDefaultUI: true,
        maxZoom: maxZoom,
        minZoom:minZoom
      });
      map.mapTypes.set('scroll', type);
      map.setMapTypeId('scroll');
      scroll.zoom = minZoom;


      google.maps.event.addListener(map, 'projection_changed', function() {

        var start = {
          x: getViewPercent().x/2,
          y: getViewPercent().y/2
        }
        if (initCenter)
          view.setCenterPercent(initCenter)
        else
          view.setCenterPercent(start)
        initCenter = null;
      });

      google.maps.event.addListener(map, 'bounds_changed', function() {
        var rect = limit();
        $(view).trigger('bounds', rect);
      });

      google.maps.event.addListener(map, 'drag', function() {
        var rect = limit();
        // $(view).trigger('bounds', rect);
      });

      google.maps.event.addListener(map, 'zoom_changed', function() {
        // limit();
        $(view).trigger('zoom', map.getZoom());
      });

    }

    function limit() {
      var b = gboundsToPercentBounds(map.getBounds());
      if (b.width >= 0 && b.x + b.width <= 1 &&
        b.y >=0 && b.y + b.height <= 1)
        {
          return b;
        }

      var viewPercent = getViewPercent();
      var newBounds = {};

      newBounds.x = b.x;
      newBounds.y = b.y;
      newBounds.width = viewPercent.x;
      newBounds.height = viewPercent.y;

      if (b.width < 0)
        newBounds.x = 0
      else if (b.x + b.width > 1)
        newBounds.x = 1 - newBounds.width;

      if (b.y < 0)
        newBounds.y = 0
      else if (b.y + b.height > 1)
        newBounds.y = 1 - newBounds.height;

      newBounds.center = {
        x:newBounds.x + newBounds.width/2,
        y:newBounds.y + newBounds.height/2
      }

      var center = gpointToLatLng(percentToGPoint(newBounds.center))
      map.setCenter(center);
      return newBounds;
    }

    function getViewPercent () {
      var viewPercent = {};
      viewPercent.x = viewSize.w / fullSize.w / Math.pow(2 ,map.getZoom() - maxZoom) ;
      viewPercent.y = viewSize.h / fullSize.h / Math.pow(2 ,map.getZoom() - maxZoom) ;
      return viewPercent;
    }

    function gpointToPoint(gpoint) {
      var p = {};
      p.x = gpoint.x * Math.pow(2,map.getZoom());
      p.y = gpoint.y * Math.pow(2,map.getZoom());
      return p;
    }

    function pointToGPoint(point) {
      var p = {};
      p.x = point.x / Math.pow(2,map.getZoom());
      p.y = point.y / Math.pow(2,map.getZoom());
      return p;
    }

    function pointToPercent(point) {
      var p = {};
      p.x = point.x * Math.pow(2,maxZoom) / fullSize.w ;
      p.y = point.y * Math.pow(2,maxZoom) / fullSize.h;
      return p;
    }

    function percentToGPoint(percent) {
      var p = {};
      p.x = (percent.x / Math.pow(2,maxZoom)) * fullSize.w ;
      p.y = (percent.y / Math.pow(2,maxZoom)) * fullSize.h;
      return p;
    }


    function gboundsToPointBounds (gbounds) {
      var rect = {};
      rect.topRight = latLngToGPoint(gbounds.getNorthEast());
      rect.bottomLeft = latLngToGPoint(gbounds.getSouthWest());
      rect.x = rect.bottomLeft.x;
      rect.y = rect.topRight.y;
      rect.width = rect.topRight.x - rect.x;
      rect.height = rect.bottomLeft.y - rect.y;
      return rect;
    }

    function pointBoundsToPixBounds (pointBounds) {
      var rect = {};
      rect.topRight = gpointToPoint(pointBounds.topRight);
      rect.bottomLeft = gpointToPoint(pointBounds.bottomLeft);
      rect.x = rect.bottomLeft.x;
      rect.y = rect.topRight.y;
      rect.width = rect.topRight.x - rect.x;
      rect.height = rect.bottomLeft.y - rect.y;
      return rect;
    }

    function gboundsToPercentBounds (gbounds) {
      var rect = {};
      var pointBounds = gboundsToPointBounds(gbounds);
      rect.topRight = pointToPercent(pointBounds.topRight);
      rect.bottomLeft = pointToPercent(pointBounds.bottomLeft);
      rect.x = rect.bottomLeft.x;
      rect.y = rect.topRight.y;
      rect.width = rect.topRight.x - rect.x;
      rect.height = rect.bottomLeft.y - rect.y;
      return rect;
    }

    function percentBoundsToGBounds (perc) {
      perc.topRight = perc.topRight || {x: perc.x + perc.width, y: perc.y};
      perc.bottomLeft = perc.bottomLeft || {x: perc.x, y: perc.y + perc.height};
      var topRight = gpointToLatLng(percentToGPoint(perc.topRight));
      var bottomLeft = gpointToLatLng(percentToGPoint(perc.bottomLeft));
      return new google.maps.LatLngBounds( bottomLeft, topRight );

    }

    function latLngToGPoint(latLng) {
      return map.getProjection().fromLatLngToPoint(latLng);
    }

    function gpointToLatLng(point) {
      return map.getProjection().fromPointToLatLng(point);
    }

    function pixToLatLong (pix) {
      var point = pointToGPoint(pix);
      return gpointToLatLng(point);
    }

    function loadScript() {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "http://maps.google.com/maps/api/js?sensor=false&callback=gsvMapsAPIInit";
      document.body.appendChild(script);
    }

  }