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

    // PostgreSQL
    DB_HOST: 'localhost',
    DB_USER: 'roboswarm',
    DB_PASSWORD: 'red;cog$40',
    DB_PORT: '5432',

    // Redis
    ROBOSWARM__REDIS_URL: 'redis://localhost:6379'
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
      'post-deploy': postDeployCommands.join(" && ")
    },
    {
      name: 'RoboSwarm Workers',
      script: 'dist/workers/provisionWorker.js',
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      kill_timeout: 60000,
      env: { },
      env_production,
      'post-deploy': postDeployCommands.join(" && ")
    }],

    deploy : {
      production : {
        user : 'jack',
        host : ['192.168.1.65'],
        ref  : 'origin/home-server',
        repo : 'git@github.com:vital101/roboswarm-server.git',
        path : '/home/jack/repos/roboswarm-server',
        'post-deploy' : postDeployCommands.join(" && ")
      }
    }
  };

