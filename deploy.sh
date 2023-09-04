#!/bin/bash

# Fetch latest code, build
cd /home/jack/repos/roboswarm-server
echo "Fetching latest code..."
git pull
echo "Installing dependencies"
npm i
echo "Building Roboswarm."
npm run build
echo "Running database migrations"
npm run migrate

# Restart API and Worker
echo "Restarting API and worker."
pm2 restart all --update-env
pm2 save

# Clear Nginx static assets cache
echo "Clearing Nginx static asset cache."
sudo su -c 'cd /var/cache/nginx && rm -rf *'
echo "Done deploying Roboswarm Server"
