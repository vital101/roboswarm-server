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
    env_production: { }
  },
  {
    name: 'RoboSwarm Workers',
    script: 'dist/workers/provisionWorker.js',
    instances: 3,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: { },
    env_production: { }
  }],

  deploy : {
    production : {
      user : 'root',
      host : '45.55.43.188',
      ref  : 'origin/master',
      repo : 'git@bitbucket.org:roboswarm/roboswarm-server.git',
      path : '/var/www/roboswarm',
      'pre-setup': 'apt-get install -y build-essential',
      'post-deploy' : postDeployCommands.join(" && ")
    }
  }
};

