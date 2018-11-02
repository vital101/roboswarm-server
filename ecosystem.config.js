const postDeployCommands = [
  'apt-get install -y build-essential',
  'npm config set -g production false',
  'npm install',
  'npm run migrate',
  'npm run build',
  'pm2 reload ecosystem.config.js --env production'
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
  }],

  deploy : {
    production : {
      user : 'root',
      host : '45.55.43.188',
      ref  : 'origin/master',
      repo : 'git@bitbucket.org:roboswarm/roboswarm-server.git',
      path : '/var/www/roboswarm',
      'post-deploy' : postDeployCommands.join(" && ")
    }
  }
};

