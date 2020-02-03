To Create a New Image
=====================

ufw allow 8000:65535/tcp
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1
apt-get update
export DEBIAN_FRONTEND=noninteractive && apt-get install -y python2.7 python-pip unzip traceroute emacs

## SnapShot Naming Format

roboswarm-nyc3-02-2020
