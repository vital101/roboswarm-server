exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.boolean("is_advanced_route_template").default(false);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("is_advanced_route_template");
    });
};