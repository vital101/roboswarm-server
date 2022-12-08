// Environment variables
require("dotenv").config();

let connection = {
  host: process.env.DB_HOST || "10.0.2.2",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || undefined,
  port: process.env.DB_PORT || 5432,
  database: "roboswarm",
  timezone: "utc",
};

if (process.env.NODE_ENV === "production") {
  const [ userPassword, hostPortDatabase ] = process.env.DATABASE_URL.replace("postgresql://", "").split("@");
  const [ user, password ] = userPassword.split(":");
  const [ host, portDatabase ] = hostPortDatabase.split(":");
  const [ port, database ] = portDatabase.split("/");
  connection = {
      host,
      user,
      password,
      port,
      database,
      timezone: "utc"
  };
}

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
