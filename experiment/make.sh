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
add src/components/*.js
addString "})();"

# add built libraries for dashboard
cp glimpse.js d3.js docs-template/resources

# generate documentation
jsduck src --template=docs-template --welcome=dashboard.html --images=docs-template/resources/images --title=Glimpse --categories=categories.json --output docs

# src length
echo "Source size:" `cat \`find src -type f -follow -print\` | wc -l` "lines."
echo "Uncompressed Size:" `du -sh glimpse.js|cut -f1`
uglifyjs glimpse.js -c -m -o > glimpse.min.js
echo "Compressed Size:" `du -sh glimpse.min.js|cut -f1`
