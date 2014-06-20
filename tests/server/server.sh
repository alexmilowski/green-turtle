#!/bin/bash
d=`dirname $0`
java -jar $d/xproclet-server.jar $*
