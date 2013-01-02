#!/bin/sh

function add {
  while [ $# -ne 0 ]
    do
      echo "Current File: $1 , Remaining $#"
      cat $1 >> glimpse.js
      shift
  done
}

function addString {
  echo $1 >> glimpse.js
}

function addIndented {
  awk '{print "  " $0}' $1 >> glimpse.js
}

rm glimpse.js

addString "(function() {"
add src/core/*.js
add src/d3/*.js
add src/components/core.js \
    src/components/defaults.js \
    src/components/legend.js \
    src/components/loader.js \
    src/components/linegraph.js \
    src/components/bargraph.js \
    src/components/graph.js
addString "})();"

# add built libraries for dashboard
#cp glimpse.js d3.js docs-template/resources

# generate documentation
#jsduck src --template=docs-template --welcome=dashboard.html --images=docs-template/resources/images --title=Glimpse --categories=categories.json --output docs
