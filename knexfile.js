// Environment variables
require("dotenv").config();

const devDbConnection = {
  host: process.env.DB_HOST || '10.0.2.2',
  user: process.env.DB_USER || 'postgres',
  database: 'roboswarm'
};

module.exports = {

  development: {
    client: 'pg',
    connection: devDbConnection,
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
