#!/bin/bash

yarn prod:notify &
echo 'executed "yarn prod:notify"';

node server &
echo 'executed "node server"';

echo 'waiting for jobs to finish...'
wait (jobs -p)
