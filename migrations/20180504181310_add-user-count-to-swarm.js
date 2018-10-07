exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.integer("simulated_users");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("simulated_users");
    });
};
