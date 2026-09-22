// Procesos de produccion para pm2 (API y web). Se usa desde la raiz del repo:
//   pm2 start ecosystem.config.cjs
//
// Las variables salen del .env de la raiz, igual que en desarrollo, para que
// exista una sola fuente de verdad. pm2 no lee .env por su cuenta, por eso se
// parsea aqui con dotenv (que ya viene como dependencia de dotenv-cli).
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const raiz = __dirname;
const env = {
  ...dotenv.parse(fs.readFileSync(path.join(raiz, '.env'))),
  NODE_ENV: 'production',
};

module.exports = {
  apps: [
    {
      name: 'timeflow-api',
      cwd: path.join(raiz, 'src/backend'),
      script: 'dist/main.js',
      env,
      max_memory_restart: '400M',
      time: true,
    },
    {
      name: 'timeflow-web',
      cwd: path.join(raiz, 'src/frontend'),
      script: path.join(raiz, 'node_modules/next/dist/bin/next'),
      args: `start -p ${env.WEB_PORT ?? 3000}`,
      env,
      max_memory_restart: '400M',
      time: true,
    },
  ],
};
