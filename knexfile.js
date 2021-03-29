// Environment variables
require("dotenv").config();

const dbConnection = {
  host: process.env.DB_HOST || '10.0.2.2',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
  database: 'roboswarm',
  timezone: 'utc'
};

module.exports = {

  development: {
    client: 'pg',
    connection: dbConnection,
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
      host: 'private-kernl-postgres-do-user-162347-0.b.db.ondigitalocean.com', // Private network
      user: 'roboswarm',
      password: 'unar60tjqhzy2oy2',
      database: '25060',
      timezone: 'utc',
      ssl: {
        rejectUnauthorized: false
      }
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
