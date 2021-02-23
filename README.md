To Create a New Image
=====================

## System level
ufw allow 8000:65535/tcp
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1
apt-get update
export DEBIAN_FRONTEND=noninteractive && apt-get install -y python3-pip unzip traceroute emacs

## Python level
copy requirements.template.txt to /root in server
pip3 install -r requirements.txt

## SnapShot Naming Format

roboswarm-nyc3-02-2020

## TODO
- Update the new image python version
- Add note about copying the snapshot to all regions
- Test locally by changing the snapshot id that generates the images
