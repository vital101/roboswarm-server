// Environment variables
require("dotenv").config();

const connection = {
  host: process.env.ROBOSWARM__DB_HOST || "10.0.2.2",
  user: process.env.ROBOSWARM__DB_USER || "postgres",
  password: process.env.ROBOSWARM__DB_PASSWORD || undefined,
  port: process.env.ROBOSWARM__DB_PORT || 5432,
  database: "roboswarm",
  timezone: "utc",
};

module.exports = {

  development: {
    client: 'pg',
    connection,
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
      ...connection,
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
