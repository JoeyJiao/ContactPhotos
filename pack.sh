#!/bin/bash

NAME=ContactPhotos.xpi
[ -f ${NAME} ] && rm -rf ${NAME}
zip -r ${NAME} *
