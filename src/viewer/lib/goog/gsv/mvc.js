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

goog.provide('goog.gsv.mvc');


goog.gsv.mvc.Model = function () {

  var model = this;
  var props = this;

  // this.define = function (name, val)
  // {
    // model.__defineSetter__(name, function (v) {
      // props[name] = v;
      // $(this).trigger('change', [[{key:name, val:v}]]);
    // });
//
    // model.__defineGetter__(name, function () {
      // return props[name];
    // });
//
    // model[name] = val;
  // }
//
  this.preProcess = function (obj) {
    // override
  }

  this.postProcess = function (obj) {
    // override
  }

  this.set = function (obj)
  {
    this.preProcess(obj);

    var changed = [];
    for ( var key in obj )
    {
      props[key] = obj[key];
      changed.push({key:key, val:obj[key]});
    }

    this.postProcess(obj);

    $(model).trigger('change', [changed]);

    return obj;
  }

  this.get = function (key) {
    return props[key];
  }

};


goog.gsv.mvc.View = function (model, el) {

  var _this = this;
  var tmpl;
  var rawTmpl;
  this.bindings = {};

  this.bind = function (key, func) {
    this.bindings[key] = func;
    if (this.model && this.model[key])
      func(this.model[key]);
  }

  this.propChange = function (e, props) {
    for (var i = 0; i<props.length; i++)
    {
      var prop = props[i];
      if (_this.bindings[prop.key])
        _this.bindings[prop.key](prop.val);
    }
  }

  this.model = model;
  this.$ = el || document.createElement('div');

  $(model).change( this.propChange );
}



goog.gsv.mvc.Service = function (modelClass)
{
  var _this = this;
  if (modelClass)
    _this.model = new modelClass;

  this.get = function (url, data, sync)
  {
    var _async = !Boolean(sync);
    jQuery.ajax(url, {data:data, success:this.onLoad, error:this.onError, dataType:'json', async:_async});
    return _this.model;
  }

  this.onLoad = function (result)
  {
    if (_this.model)
      _this.model.set(result);
    $(_this).trigger('complete', _this.model);
  }

  this.onError = function (result)
  {
    $(_this).trigger('error', result);
  }
}


goog.gsv.mvc.ext = function (sub, sup, args) {
  args = args || [];
  if ( !(typeof(sup)=="undefined") ) {
    sup.apply(sub, args);
  }
}