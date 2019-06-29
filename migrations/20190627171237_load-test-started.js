exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.boolean("load_test_started").default(false);
    });
    await knex("swarm").update({ load_test_started: true });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("load_test_started");
    });
};
