exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.text("host_url");
        table.integer("spawn_rate");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("host_url");
        table.dropColumn("spawn_rate");
    });
};
