import * as knex from "knex";

const development = {
    client: "pg",
    connection: {
        host: "localhost",
        user: "",
        password: "",
        database: "roboswarm"
    }
};

const production = {
    client: "pg",
    connection: {
        database: "roboswarm",
        user: "roboswarm",
        password: "DontSwarmMeBro"
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