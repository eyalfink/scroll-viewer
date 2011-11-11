#! /usr/bin/python2.4
#

"""Helper functions for bulkloader."""


def string_to_list(kind):
  def generate_string_to_list(s):
    return s.split(',')
  return generate_string_to_list
