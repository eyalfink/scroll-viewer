/**
 * @author Hovav
 */


goog.provide('gsv.util');

goog.gsv = goog.gsv || {};
goog.gsv.util = goog.gsv.util || {};

// loader
goog.gsv.util.Loader = function (numConnections) {

  var queue = [];
  var current;
  var numConnections = numConnections || 1;
  var completeCount = 0;

  this.loading = false;

  this.addItem = function (item) {
    if (!item.priority)
      item.priority = queue.length;
    queue.push(item);

    return item;
  }

  this.start = function () {
    this.loading = true;

    for(var i = 0; i < numConnections; i++)
      this.loadNext();
  }

  this.loadNext = function () {
    if (queue.length > 0)
    {
      sortByPriority();
      current = queue[0];
      $(current).bind('complete', $.proxy(function ()
      {
        // remove current from queue
        queue = jQuery.grep(queue, function(value) {
          return value != current;
        });

        this.loadNext();
      }, this));

      current.load();
    }
    else
    {
      completeCount ++;
      if (completeCount == numConnections)
        this.onComplete();
    }
  }


  this.onComplete = function () {
    this.loading = false;
    $(this).trigger('complete-all');
  }

  function sortByPriority() {
    queue.sort(function(a,b){
      return a.priority - b.priority;
    });
  }

}

// loaderItem
goog.gsv.util.LoaderItem = function (url, cback, priority) {

  this.complete = false;
  this.url = url;
  this.cback = cback;
  this.priority = priority;

  var item = this;

  this.load = function () {

  }

  this.onComplete = function (data) {
    item.complete = true;
    if (cback) cback.call(this, data);
    $(item).trigger('complete', data);
  }

}

// loaderItemImage
goog.gsv.util.LoaderItemImage = function (url, cback, destimage, priority) {

  goog.gsv.mvc.ext(this, goog.gsv.util.LoaderItem, [url, cback, priority]);

  var item = this;
  var img = new Image();

  if (destimage)
    $(destimage).css({opacity:0});

  img.onload = function () {
    if (destimage) $(destimage).attr('src', img.src).animate({opacity:1}, 200);
    item.onComplete();
    delete img;
  }

  this.load = function () {
     img.src = url;
  }
}

// loaderItemAjax
goog.gsv.util.LoaderItemJson = function (url, cback, data, priority) {

  goog.gsv.mvc.ext(this, goog.gsv.util.LoaderItem, [url, cback, priority]);

  var item = this;

  this.load = function () {
    $.ajax(url, {data: data, dataType:'json',success:function (res) {
      item.onComplete(res);
    }});

  }
}

