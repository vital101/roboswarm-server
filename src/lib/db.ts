import * as Knex from "knex";

const connection: any = {
    host: process.env.ROBOSWARM__DB_HOST || "10.0.2.2",
    user: process.env.ROBOSWARM__DB_USER || "postgres",
    password: process.env.ROBOSWARM__DB_PASSWORD || undefined,
    port: process.env.ROBOSWARM__DB_PORT || 5432,
    database: "roboswarm",
    timezone: "utc",
};

const development = {
    client: "pg",
    connection,
    // debug: true
};

const production = {
    client: "pg",
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
        tableName: "knex_migrations"
    }
};

const instance: Knex.Knex = Knex.knex(process.env.NODE_ENV === "production" ? production : development);

export const db: Knex.Knex = instance;