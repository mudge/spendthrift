#!/bin/bash
SHA1=$(git show-ref --heads | awk '{print $1}')
curl -s --data-urlencode js_code@js/st.js --data output_info=compiled_code --data compilation_level=SIMPLE_OPTIMIZATIONS -o js/stc.js http://closure-compiler.appspot.com/compile
sed -i"" "$ s/.*/# $SHA1/" spendthrift.manifest
git add js/stc.js spendthrift.manifest
