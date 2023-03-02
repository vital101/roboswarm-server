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
    REDIS_URL: 'redis://localhost:6379'
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
      'pre-setup': 'apt-get install -y build-essential',
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
      'pre-setup': 'apt-get install -y build-essential',
      'post-deploy': postDeployCommands.join(" && ")
    }],

    deploy : {
      production : {
        user : 'jack',
        host : ['192.168.1.65'],
        ref  : 'origin/master',
        repo : 'git@bitbucket.org:roboswarm/roboswarm-server.git',
        path : '/home/jack/repos/roboswarm',
        'pre-setup': 'apt-get install -y build-essential',
        'post-deploy' : postDeployCommands.join(" && ")
      }
    }
  };

