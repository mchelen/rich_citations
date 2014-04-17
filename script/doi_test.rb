#!/usr/bin/env ./bin/rails runner

Rails.logger = Logger.new($stdout)

require 'pp'

DOI='10.1371/journal.pone.0046843'
DOI='10.1371/journal.pbio.0050222xxx'

xml = Plos::Api.document( DOI )
parser = Plos::PaperParser.new(xml)
info = parser.paper_info

if info
  pp info
else
  puts "\n*************** Document #{DOI} could not be retrieved\n"
end
