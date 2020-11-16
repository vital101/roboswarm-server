exports.up = async function (knex, Promise) {
    await knex.schema.createTable("load_test_route_specific_data", table => {
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
        table.integer("failures_per_second");
        table.integer("user_count");
        table.integer("50_percent");
        table.integer("66_percent");
        table.integer("75_percent");
        table.integer("80_percent");
        table.integer("90_percent");
        table.integer("95_percent");
        table.integer("98_percent");
        table.integer("99_percent");
        table.integer("100_percent");

        table.foreign("swarm_id").references("swarm.id");
        table.index("swarm_id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_route_specific_data");
};