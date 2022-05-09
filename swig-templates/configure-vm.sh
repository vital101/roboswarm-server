#!/bin/sh

# Disable ipv6
echo "Disabling IPv6"
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1

# Set ready and ip for this machine
MYIP=$(ip -o route get to 8.8.8.8 | sed -n 's/.*src \([0-9.]\+\).*/\1/p')
ISREADYBODY=$(cat <<-END
    {
        "action": "is_ready",
        "ip_address": "${MYIP}"
    }
END
)
echo "Setting ready and IP: ${MYIP}"
curl -X POST {{baseUrl}}/api/v1/public/machine/{{machineId}}/status -H 'Content-Type: application/json' -d "$ISREADYBODY" > /dev/null

# Set is_master
echo "Setting is_master"
curl -X POST {{baseUrl}}/api/v1/public/machine/{{machineId}}/status -H 'Content-Type: application/json' -d '{"action":"is_master"}' > /dev/null

# Open the firewall for Locust
echo "Opening firewall for Locust"
ufw allow 8000:65535/tcp
curl -X POST {{baseUrl}}/api/v1/public/machine/{{machineId}}/status -H 'Content-Type: application/json' -d '{"action":"port_open_complete"}' > /dev/null

# Wait for apt to become available.
while sudo fuser /var/{lib/{dpkg,apt/lists},cache/apt/archives}/lock >/dev/null 2>&1; do
   sleep 1
done

# Install necessary packages
export DEBIAN_FRONTEND=noninteractive && apt update
export DEBIAN_FRONTEND=noninteractive && apt upgrade -y
export DEBIAN_FRONTEND=noninteractive && apt-get install -y python3-pip wget unzip traceroute emacs

# Download the template file and unzip
echo "Downloading and unzipping load test template"
wget {{baseUrl}}/api/v1/public/machine/{{machineId}}/template
unzip template
echo "Updating dependency_install_complete"
curl -X POST {{baseUrl}}/api/v1/public/machine/{{machineId}}/status -H 'Content-Type: application/json' -d '{"action":"dependency_install_complete"}' > /dev/null

# If is master, start master
echo "Checking if this machine is master"
ISMASTER=$(curl {{baseUrl}}/api/v1/public/machine/{{machineId}}/is-master)
if [ "$ISMASTER" = "true" ]; then
   # Start master
   echo "Starting master"
   ulimit -n 200000
   PYTHONWARNINGS="ignore:Unverified HTTPS request" nohup locust --master --csv=status --host={{hostUrl}} --users={{users}} --spawn-rate={{rate}} --run-time={{runTime}} --headless --expect-workers={{expectSlaveCount}} > /dev/null 2>&1
   curl -X POST {{baseUrl}}/api/v1/public/machine/{{machineId}}/status -H 'Content-Type: application/json' -d '{"action":"master_started_complete"}'
fi

# If is slave, check to see master is started.
if [ "$ISMASTER" = "false" ]; then
   while [ $(curl {{baseUrl}}/api/v1/public/machine/{{machineId}}/is-master-started) = "false" ]; do
      sleep 2
      echo "Master not started. Waiting 2 seconds."
   done
   echo "Master started. Starting Locust worker."
   # WIP
fi

echo "Done with initialization."