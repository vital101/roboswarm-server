exports.up = async function (knex, Promise) {
    await knex.schema.createTable("load_test_error", table => {
        table.integer("swarm_id");
        table.text("method");
        table.text("path");
        table.text("message");
        table.integer("error_count");

        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.foreign("swarm_id").references("swarm.id");
        table.unique(["swarm_id", "method", "path", "message"]);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_error");
};