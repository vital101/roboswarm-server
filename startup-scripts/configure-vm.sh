#!/bin/sh

# Disable ipv6
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1

# Open the firewall for Locust
ufw allow 8000:65535/tcp
# WIP -> Report back port_open_complete

# Wait for apt to become available.
while sudo fuser /var/{lib/{dpkg,apt/lists},cache/apt/archives}/lock >/dev/null 2>&1; do
   sleep 1
done

# Install necessary packages
export DEBIAN_FRONTEND=noninteractive && apt update
export DEBIAN_FRONTEND=noninteractive && apt upgrade -y
export DEBIAN_FRONTEND=noninteractive && apt-get install -y python3-pip wget unzip traceroute emacs
# WIP -> Report back dependency_install_complete