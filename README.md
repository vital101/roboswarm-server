Start the processes with PM2
============================

## If none exist
cd /home/jack/repos/roboswarm-server && npm run build && pm2 start npm --instances 1 --name "Roboswarm: API" -- run serve
cd /home/jack/repos/roboswarm-server && pm2 start npm --instances 1 --name "Roboswarm: Worker" -- run worker
sudo env PATH=$PATH:/usr/local/bin pm2 startup -u root
pm2 save

## If they need to be restarted
pm2 restart all

Flush the Nginx static asset cache
==================================
sudo su
cd /var/cache/nginx
rm -rf *

To Create a New Image
=====================

## Perform updates
apt update
apt upgrade -y

## System level
ufw allow 8000:65535/tcp
ufw allow 5557/tcp
ufw allow 5558/tcp
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1
export DEBIAN_FRONTEND=noninteractive && apt-get install -y python3-pip unzip traceroute emacs wget htop build-essential

## Python level
copy requirements.template.txt to /root in server
pip3 install -r requirements.txt

## SnapShot Naming Format

roboswarm-v[number]

## TODO
- Update the new image python version
- Add note about copying the snapshot to all regions
- Test locally by changing the snapshot id that generates the images
