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


