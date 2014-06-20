#!/bin/bash
mkdir -p tests/cache/html5
curl http://rdfa.info/test-suite/rdfa1.1/html5/manifest.ttl > tests/cache/html5/manifest.ttl
mkdir -p tests/cache/xhtml5
curl http://rdfa.info/test-suite/rdfa1.1/xhtml5/manifest.ttl > tests/cache/xhtml5/manifest.ttl
mkdir -p tests/cache/html4
curl http://rdfa.info/test-suite/rdfa1.1/html4/manifest.ttl > tests/cache/html4/manifest.ttl
mkdir -p tests/cache/xhtml1
curl http://rdfa.info/test-suite/rdfa1.1/xhtml1/manifest.ttl > tests/cache/xhtml1/manifest.ttl
mkdir -p tests/cache/xml
curl http://rdfa.info/test-suite/rdfa1.1/xml/manifest.ttl > tests/cache/xml/manifest.ttl

