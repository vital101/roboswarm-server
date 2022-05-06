#!/bin/sh

# Disable ipv6
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1

# Open the firewall for Locust
ufw allow 8000:65535/tcp
curl -X POST {{baseUrl}}/api/v1/public/machine/{{machineId}}/status -H 'Content-Type: application/json' -d '{"action":"port_open_complete"}'

# Wait for apt to become available.
while sudo fuser /var/{lib/{dpkg,apt/lists},cache/apt/archives}/lock >/dev/null 2>&1; do
   sleep 1
done

# Install necessary packages
export DEBIAN_FRONTEND=noninteractive && apt update
export DEBIAN_FRONTEND=noninteractive && apt upgrade -y
export DEBIAN_FRONTEND=noninteractive && apt-get install -y python3-pip wget unzip traceroute emacs

# Download the template file and unzip
wget {{baseUrl}}/api/v1/public/machine/{{machineId}}/template
unzip template.zip
curl -X POST {{baseUrl}}/api/v1/public/machine/{{machineId}}/status -H 'Content-Type: application/json' -d '{"action":"dependency_install_complete"}'

# If is master, start master
ISMASTER = $(curl {{baseUrl}}/api/v1/publick/machine/{{machineId}}/is-master)
if [ISMASTER = "true"]; then
   #
   # Start master
   #
fi
curl -X POST {{baseUrl}}/api/v1/public/machine/{{machineId}}/status -H 'Content-Type: application/json' -d '{"action":"master_started_complete"}'

# If is slave, check to see master is started.
if [ISMASTER = "false"]; then
   while [$(curl {{baseUrl}}/api/v1/publick/machine/{{machineId}}/is-master-started) = "false"]; do
      sleep 2
   done
   #
   # If started, start slave.
   #
fi