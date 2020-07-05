exports.up = async function (knex, Promise) {
    await knex.schema.createTable("load_test_file", table => {
        table.increments();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.integer("swarm_id");
        table.binary("lt_file");

        table.foreign("swarm_id").references("swarm.id");
        table.index("swarm_id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_file");
};