#!/usr/bin/python
# Copyright 2011 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"""Manipulate images to create different versions and tiles.

This class creates thumbnail, watermarked and resized versions and tiles of
images, and saves them to service.
"""
__author__ = 'lirona@google.com (Liron Achdut)'
__author__ = 'eyalf@google.com (Eyal Fink)'

import math
import sys
import os
import os.path
from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont
import simplejson

# The height of the watermark text as part of the height of the image.
TEXTMARK_HEIGHT = 0.06
# The space in pixels to be left from the bottom right corner when pasting text.
TEXTMARK_SPACE = 5

MAX_TILE_SIZE = 256

class ImageManipulator(object):
  """Creates needed versions and tiles for images and saves them to service.

  This class is used for processing images. Its main functionality is in the
  'Manipulate' method, which recieves a filename of an Image and creates and
  saves all necessary manipulations to service.

  Attributes:
    watermark: An Image that will be used as a watermark (used on tiles).
  """

  def __init__(self, watermark=None):
    self.watermark = watermark

  def _Watermark(self, image):
    """Creates a watermarked image.

    Pastes the watermark in the bottom right corner of the image.

    Args:
      image: The Image to watermark.

    Returns:
      A new watermarked Image.
    """
    img = image.copy()
    if self.watermark:
      img.paste(self.watermark, (img.size[0]-self.watermark.size[0],
                                 img.size[1]-self.watermark.size[1]),
                self.watermark)
    return img

  def _Textmark(self, image, text, truefont=None, opacity=50):
    """Creates an image watermarked with the given text.

    Pastes the text in the given font and size TEXTMARK_HEIGHT of the image's
    height, in the bottom right corner of the image.

    Args:
      image: The image to watermark.
      text: The text to paste in the image.
      truefont: A truefont filename for the font to be used.
      opacity: The opacity of the watermark (default: 50).
    Returns:
      A new watermarked Image with the given text.
    """
    img = image.convert('RGB')
    wm = Image.new('RGBA', img.size)
    draw = ImageDraw.ImageDraw(wm, 'RGBA')
    fontsize = int(TEXTMARK_HEIGHT * img.size[1])
    if truefont:
      font = ImageFont.truetype(truefont, fontsize)
    else:
      font = ImageFont.load_default()
    textsize = font.getsize(text)
    draw.setfont(font)
    # Draw text in bottom right corner
    draw.text(((wm.size[0] - textsize[0] - TEXTMARK_SPACE),
               (wm.size[1] - textsize[1] - TEXTMARK_SPACE)), text)
    # Make transperent by adding an alpha layer on the watermark
    # (PIL alpha layer must be of type 'L' or '1')
    mask = wm.convert('L').point(lambda x: min(x, opacity))
    wm.putalpha(mask)
    img.paste(wm, None, wm)
    return img

  def _CubicThumbnail(self, image, thumbsize):
    """Creates a cubic thumbnail of an image.

    Cuts out a square area in the middle of the image.

    Args:
      image: The Image to watermark.
      thumbsize: The wanted size of the thumbnail.

    Returns:
      A thumbnail of the image, of size thumbsize X thumbsize.
    """
    # Resize the image to the smallest size that still contains a square
    # of the requested thumbsize.
    width, height = image.size
    size = max(float(width) * thumbsize / height,
               float(height) * thumbsize / width)
    size = int(math.ceil(size))
    img = self._Resize(image, (size, size))
    # Crop the square area from the center
    width, height = img.size
    if width < height:
      top = float(height) / 2 - float(thumbsize) / 2
      top = int(math.ceil(top))
      box = (0, top, thumbsize, top + thumbsize)
    else:
      left = float(width) / 2 - float(thumbsize) / 2
      left = int(math.ceil(left))
      box = (left, 0, left + thumbsize, thumbsize)
    cropped = img.crop(box)
    return cropped

  def _Resize(self, image, size):
    """Creates a proportional resized image.

    Resizes the image to the given size.
    If the given size is not proportional to the image's size, returns the
    biggest proportional copy of the image which fits in the given size.

    Args:
      image: The Image to watermark.
      size: A tuple representing the wanted width and height.

    Returns:
      A new Image of the given size.
    """
    img = image.copy()
    img.thumbnail(size, Image.ANTIALIAS)
    return img

  def _ResizeHeight(self, image, height):
    """Creates a proportional resized image with the given height.

    Resizes the image to keep it's proportions but have the given height.

    Args:
      image: The Image to watermark.
      height: The wanted height.

    Returns:
      A new Image with the given height.
    """
    size = (image.size[0], height)
    img = self._Resize(image, size)
    return img

  def _CreateTiles(self, image, tiles_dir):
    """Creates tiles for zooming with Maps API and saves them to service.

    Creates all necessary tiles for zooming in the image using Maps API.
    Saves the tiles and a JSON file with tile information back to service.

    Args:
      image: The Image to process.
      tiles_dir: The direcotry to which we write the tiles.

    Returns:
      A tuple containing the size of each tile and the number of zoom levels.
    """
    width, height = image.size
    size = max(width, height)

    # Calculate the maximum number of zoom levels that fit in the image.
    # We're looking for the biggest number such that:
    # 2**zoomlevels * tile_size <= image's size
    zoomlevels = int(math.ceil(math.log(size / float(MAX_TILE_SIZE), 2)))

    # If the image is smaller than the tile size, make one tile in zoom level 0
    # which is the watermarked image + one more zoom level.
    if zoomlevels <= 0:
      zoomlevels = 2
      tile_size = (width, height)
    else:
      # Calculate size of tiles in all zoom levels
      # (fits in MAX_TILE_SIZE x MAX_TILE_SIZE)
      tile_size = (int(round(float(width) / (2 ** zoomlevels))),
                   int(round(float(height) / (2 ** zoomlevels))))
      zoomlevels += 1

    for zoom in range(zoomlevels):
      ntiles = 2 ** zoom
      tile_width = float(width) / ntiles
      tile_width = int(round(tile_width))
      tile_height = float(height) / ntiles
      tile_height = int(round(tile_height))
      for x in range(0, ntiles):
        for y in range (0, ntiles):
          box = (x * tile_width, y * tile_height,
                 (x+1) * tile_width, (y+1) * tile_height)
          tile = image.crop(box)
          # The box might be beyond the image so we are putting
          # black pixels.
          right_leftover = ((x+1) * tile_width) - width
          if right_leftover > 0:
            tile.paste(0, (tile.size[0] - right_leftover, 0,
                           tile.size[0], tile.size[1]))

          bottom_leftover = (y+1) * tile_height - height
          if bottom_leftover > 0:
            tile.paste(0, (0, tile.size[1] - bottom_leftover,
                           tile.size[0], tile.size[1]))

          tile.resize(tile_size)
          if self.watermark:
            tile = self._Watermark(tile)
          tile_name = '%s/%s_%s_%s.png' % (tiles_dir, zoom, x, y)
          
          if not os.path.exists(os.path.dirname(tile_name)):
            os.makedirs(os.path.dirname(tile_name))
          tile.save(tile_name)
          print 'Adding tile %s' % tile_name

    json_string = simplejson.dumps({'zoomlevels': zoomlevels,
                                    'tileSize': tile_size})
    json_name = '%s/info.json' % tiles_dir
    open(json_name, 'w').write(json_string)
    print 'Adding json file %s' % json_name

    return (tile_size, zoomlevels)


if __name__ == '__main__':
  filename = sys.argv[1]
  tiles_dir = sys.argv[2]
  base_filename = filename[:filename.rfind('.')]

  img = Image.open(filename)

  manipulator = ImageManipulator()
  thumb = manipulator._ResizeHeight(img, 35)
  thumb.save('%s-thumb.png' % base_filename)

  manipulator._CreateTiles(img, tiles_dir)
