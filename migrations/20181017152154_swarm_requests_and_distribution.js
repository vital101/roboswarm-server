exports.up = async function (knex, Promise) {
    await knex.schema.createTable("load_test_requests", (table) => {
        table.increments();
        table.integer("swarm_id");
        table.timestamp("created_at").defaultTo(knex.fn.now());
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

    await knex.schema.createTable("load_test_distribution", (table) => {
        table.increments();
        table.integer("swarm_id");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.integer("requests");
        table.json("percentiles");

        table.foreign("swarm_id").references("swarm.id");
        table.index("swarm_id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_requests");
    await knex.schema.dropTable("load_test_distribution");
};