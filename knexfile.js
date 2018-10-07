// Update with your config settings.

module.exports = {

  development: {
    client: 'pg',
    connection: {
      database: 'roboswarm',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: {
      database: 'roboswarm',
      user: 'roboswarm',
      password: 'DontSwarmMeBro'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

};
