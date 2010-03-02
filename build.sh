curl -s --data-urlencode js_code@st.js --data output_info=compiled_code --data compilation_level=SIMPLE_OPTIMIZATIONS -o stc.js http://closure-compiler.appspot.com/compile
sed -i "$ s/.*/# `git show-ref --heads | awk '{print $1}'`/" spendthrift.manifest
git add stc.js spendthrift.manifest

