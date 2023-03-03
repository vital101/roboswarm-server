// Environment variables
require("dotenv").config();

let connection = {
  host: process.envROBOSWARM__DB_HOST || "10.0.2.2",
  user: process.envROBOSWARM__DB_USER || "postgres",
  password: process.envROBOSWARM__DB_PASSWORD || undefined,
  port: process.envROBOSWARM__DB_PORT || 5432,
  database: "roboswarm",
  timezone: "utc",
};

if (process.env.NODE_ENV === "production") {
  const [ userPassword, hostPortDatabase ] = process.env.DATAROBOSWARM__BASE_URL.replace("postgresql://", "").split("@");
  const [ user, password ] = userPassword.split(":");
  const [ host, portDatabase ] = hostPortDatabase.split(":");
  const [ port, database ] = portDatabase.replace("?sslmode=require", "").split("/");
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
