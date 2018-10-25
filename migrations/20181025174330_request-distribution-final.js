exports.up = async function (knex, Promise) {
    await knex.schema.createTable("load_test_requests_final", (table) => {
        table.increments();
        table.integer("swarm_id");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.text("method");
        table.text("route");
        table.integer("requests");
        table.integer("failures");
        table.integer("median_response_time");
        table.integer("average_response_time");
        table.integer("min_response_time");
        table.integer("max_response_time");
        table.integer("avg_content_size");
        table.integer("requests_per_second");

        table.foreign("swarm_id").references("swarm.id");
        table.index("swarm_id");
    });

    await knex.schema.createTable("load_test_distribution_final", (table) => {
        table.increments();
        table.integer("swarm_id");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.text("method");
        table.text("route");
        table.integer("requests");
        table.json("percentiles");

        table.foreign("swarm_id").references("swarm.id");
        table.index("swarm_id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_requests_final");
    await knex.schema.dropTable("load_test_distribution_final");
};