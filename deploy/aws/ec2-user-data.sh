#!/bin/bash
# EC2 launch template / user data (Amazon Linux 2023)
# Paste into: EC2 → Launch instance → Advanced → User data
set -euxo pipefail

dnf update -y
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user

# Docker Compose v2 plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 2GB swap (helps during docker build on 8GB instances)
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

mkdir -p /opt/devconnect
chown ec2-user:ec2-user /opt/devconnect

# Clone your repo (replace with your Git URL or use S3/CodeDeploy later)
# su - ec2-user -c 'git clone https://github.com/YOUR_ORG/devconnect.git /opt/devconnect'

echo "Bootstrap complete. SSH in, clone repo to /opt/devconnect, configure deploy/aws/.env, then run deploy/aws/deploy.sh"
