#!/bin/sh

node watcher.js &
echo 'executed "node watcher.js"';

node server.js &
echo 'executed "node server"';

echo 'waiting for jobs to finish...';
wait < <(jobs -p)

