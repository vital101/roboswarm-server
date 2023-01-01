exports.up = async function (knex, Promise) {
    await knex.schema.createTable("swarm_route_cache", (table) => {
        table.increments();

        table.integer("swarm_id");
        table.foreign("swarm_id").references("swarm.id");

        table.text("routes");

        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("swarm_route_cache");
};