#!/bin/bash
for file in `find . -name '*.mp3'`;
   do ffmpeg -i "${file}" -acodec libvorbis "${file%mp3}ogg";
done
