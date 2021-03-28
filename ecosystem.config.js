const postDeployCommands = [
  'npm config set -g production false',
  'npm install',
  'npm run migrate',
  'npm run build',
  'pm2 reload ecosystem.config.js --env production',
  'pm2 save'
];

const env_production = {
  NODE_ENV: 'production',
  DB_HOST: 'private-kernl-postgres-do-user-162347-0.b.db.ondigitalocean.com', // Private network
  DB_USER: 'roboswarm',
  DB_PASSWORD: 'unar60tjqhzy2oy2',
  DB_PORT: '25060',
  REDIS_HOST: 'kernl-redis-do-user-162347-0.b.db.ondigitalocean.com', // Private network
  REDIS_PORT: '25061',
  REDIS_USERNAME: 'default',
  REDIS_PASSWORD: 'm8vqthmr4guequty',
};

module.exports = {
  apps : [{
    name: 'RoboSwarm API',
    script: 'dist/server.js',
    instances: 2,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: { },
    env_production,
  },
  {
    name: 'RoboSwarm Workers',
    script: 'dist/workers/provisionWorker.js',
    instances: 3,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    kill_timeout: 60000,
    env: { },
    env_production,
  }],

  deploy : {
    production : {
      user : 'root',
      host : ['roboswarm.kernl.us'],
      ref  : 'origin/master',
      repo : 'git@bitbucket.org:roboswarm/roboswarm-server.git',
      path : '/var/www/roboswarm',
      'pre-setup': 'apt-get install -y build-essential',
      'post-deploy' : postDeployCommands.join(" && ")
    }
  }
};

