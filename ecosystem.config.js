module.exports = {
  apps : [{
    name: 'RoboSwarm API',
    script: 'dist/server.js',
    instances: 2,
    autorestart: true,
    watch: false,
    max_memory_restart: '256MB',
    env: {
      NODE_ENV: 'development',
      TZ: 'utc'
    },
    env_production: {
      NODE_ENV: 'production',
      TZ: 'utc'
    }
  }],

  deploy : {
    production : {
      user : 'root',
      host : '159.89.184.163',
      ref  : 'origin/master',
      repo : 'git@bitbucket.org:roboswarm/roboswarm-server.git',
      path : '/var/www/roboswarm',
      'pre-setup' : 'apt-get install build-essential',
      'post-deploy' : 'npm install && npm run migrate && pm2 reload ecosystem.config.js --env production'
    }
  }
};
