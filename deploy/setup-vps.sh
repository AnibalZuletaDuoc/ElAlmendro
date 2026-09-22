#!/usr/bin/env bash
# TimeFlow - aprovisionamiento del VPS (se corre UNA vez, como ubuntu con sudo).
#
#   scp -i ~/.ssh/timeflow_vps_ed25519 deploy/setup-vps.sh ubuntu@148.113.249.196:/tmp/
#   ssh -i ~/.ssh/timeflow_vps_ed25519 ubuntu@148.113.249.196 "bash /tmp/setup-vps.sh"
#
# Deja instalado: Node 20, pm2, Docker + compose, Caddy, ufw y fail2ban, y clona
# el repositorio en /var/www/timeflow. NO crea el .env ni levanta nada: eso lo
# hace el primer deploy (ver deploy/DEPLOY.md).
set -euo pipefail

REPO_URL="https://github.com/AnibalZuletaDuoc/ElAlmendro.git"
APP_DIR="/var/www/timeflow"
USUARIO="ubuntu"

echo "== 1/8 Paquetes base"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl gnupg git ufw fail2ban build-essential python3 \
  debian-keyring debian-archive-keyring apt-transport-https unzip

echo "== 2/8 Node 20 (NodeSource) + pm2"
if ! command -v node >/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo npm install -g pm2@latest
node -v; npm -v; pm2 -v

echo "== 3/8 Docker CE + compose plugin"
if ! command -v docker >/dev/null; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  CODENAME="$(. /etc/os-release && echo "$VERSION_CODENAME")"
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $CODENAME stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
sudo usermod -aG docker "$USUARIO"
sudo systemctl enable --now docker
docker --version; docker compose version

echo "== 4/8 Caddy 2"
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y caddy
fi
sudo mkdir -p /var/log/caddy && sudo chown caddy:caddy /var/log/caddy
sudo systemctl enable caddy
caddy version

echo "== 5/8 Firewall y fail2ban"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo systemctl enable --now fail2ban
sudo ufw status verbose

echo "== 6/8 Repositorio en $APP_DIR"
sudo mkdir -p /var/www
sudo chown "$USUARIO:$USUARIO" /var/www
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
fi
git -C "$APP_DIR" config core.filemode false

echo "== 7/8 Zona horaria del sistema en UTC (la app convierte a America/Santiago al mostrar)"
sudo timedatectl set-timezone UTC

echo "== 8/8 Swap de 2G (next build puede pasar 1.5G y el VPS tiene 3.7G sin swap)"
if [[ ! -f /swapfile ]]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
fi
free -h | tail -1

echo
echo "Aprovisionamiento listo. Siguiente: crear $APP_DIR/.env y correr bash deploy/update.sh --primera-vez"
echo "Nota: el grupo docker aplica en la proxima sesion SSH (cerrar y volver a entrar)."
