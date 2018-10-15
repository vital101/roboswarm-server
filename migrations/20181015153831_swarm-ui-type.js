exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.string("swarm_ui_type").defaultTo('locust');
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("swarm_ui_type");
    });
};