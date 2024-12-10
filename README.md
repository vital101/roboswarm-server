# Roboswarm

A distributed load testing service for WordPress and WooCommerce.

## Prerequisites

Before you begin, ensure you have the following:

- DigitalOcean account with active credentials
- DigitalOcean API key with appropriate permissions
- Redis server (used as a message queue)
- PostgreSQL database instance
- Node.js runtime environment

## Installation

1. Install Node Version Manager (nvm):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. Switch to the project's Node.js version:
   ```bash
   nvm use
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Create your environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your specific configuration values

3. Initialize the database:
   ```bash
   npm run migrate
   ```

## Running the Application

Roboswarm requires two processes to run simultaneously:

1. Development server:
   ```bash
   npm start
   ```

2. Background worker:
   ```bash
   npm run worker
   ```

Both processes must be running for Roboswarm to function correctly.

## Image Creation Guide

Roboswarm dynamically provisions infrastructure in DigitalOcean for each load test. This requires a pre-configured machine image. Follow these steps to create and configure the necessary image:

### 1. Create Virtual Machine

Create a new DigitalOcean droplet with the following specifications:
- Ubuntu LTS (Latest Stable Version)
- Minimum 2 CPU cores
- Standard memory configuration

### 2. Configure the Machine

SSH into the newly created machine and execute the following commands:

```bash
# System Updates
apt update
apt upgrade -y

# Network Configuration
ufw allow 8000:65535/tcp
ufw allow 5557/tcp
ufw allow 5558/tcp

# IPv6 Configuration
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1

# Install Required Packages
export DEBIAN_FRONTEND=noninteractive
apt-get install -y \
    python3-pip \
    unzip \
    traceroute \
    emacs \
    wget \
    htop \
    build-essential

# Python Dependencies
# Copy requirements.template.txt to /root on the server
pip3 install -r requirements.txt
```

### 3. Create and Distribute Snapshot

1. Power off the droplet
2. Create a snapshot through DigitalOcean's interface
3. Transfer the snapshot to all regions using DigitalOcean's UI
4. Obtain the Snapshot ID (either through DigitalOcean's API or UI network inspection)
5. Update your `.env` file with the new Snapshot ID

## Contributing

Submit a pull request.

## License

MIT License + Common Clause
