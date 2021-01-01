const postDeployCommands = [
  'npm config set -g production false',
  'npm install',
  'npm run migrate',
  'npm run build',
  'pm2 reload ecosystem.config.js --env production',
  'pm2 save'
];
module.exports = {
  apps : [{
    name: 'RoboSwarm API',
    script: 'dist/server.js',
    instances: 2,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: { },
    env_production: {
      NODE_ENV: 'production',
      DB_HOST: '10.132.154.214',
      DB_USER: 'roboswarm',
      DB_PASSWORD: 'red;cog$40',
      REDIS_URI: 'redis://10.132.168.38',
      REDIS_PASSWORD: 'red;cog$40'
    }
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
    env_production: {
      NODE_ENV: 'production',
      DB_HOST: '10.132.154.214',
      DB_USER: 'roboswarm',
      DB_PASSWORD: 'red;cog$40',
      REDIS_URI: 'redis://10.132.168.38',
      REDIS_PASSWORD: 'red;cog$40'
    }
  }],

  deploy : {
    production : {
      user : 'root',
      host : [/*'45.55.43.188', */'roboswarm.kernl.us'],
      ref  : 'origin/master',
      repo : 'git@bitbucket.org:roboswarm/roboswarm-server.git',
      path : '/var/www/roboswarm',
      'pre-setup': 'apt-get install -y build-essential',
      'post-deploy' : postDeployCommands.join(" && ")
    }
  }
};

