import * as knex from "knex";

const devDbConnection: any = {
    host: process.env.DB_HOST || "10.0.2.2",
    user: process.env.DB_USER || "postgres",
    database: "roboswarm",
    timezone: "utc"
  };

const development = {
    client: "pg",
    connection: devDbConnection
};

const production = {
    client: "pg",
    connection: {
        database: "roboswarm",
        user: "roboswarm",
        password: "DontSwarmMeBro",
        timezone: "utc"
    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        tableName: "knex_migrations"
    }
};

const instance: knex = knex(process.env.NODE_ENV === "production" ? production : development);

export const db: knex = instance;