#!/bin/bash

# Fetch latest code, build
cd /home/jack/repos/roboswarm-server
git pull
npm run build
npm run migrate

# Restart API and Worker
pm2 restart all

# Clear Nginx static assets cache
sudo su
cd /var/cache/nginx
rm -rf *
