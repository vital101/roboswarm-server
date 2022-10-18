exports.up = async function (knex, Promise) {
    await knex.schema.alterTable("load_test_requests", (table) => {
        table.float("median_response_time").alter().nullable();
        table.float("average_response_time").alter().nullable();
        table.float("min_response_time").alter().nullable();
        table.float("max_response_time").alter().nullable();
        table.float("avg_content_size").alter().nullable();
        table.float("requests_per_second").alter().nullable();
        table.float("failures_per_second").alter().nullable();
    });

    await knex.schema.alterTable("load_test_requests_final", (table) => {
        table.float("median_response_time").alter().nullable();
        table.float("average_response_time").alter().nullable();
        table.float("min_response_time").alter().nullable();
        table.float("max_response_time").alter().nullable();
        table.float("avg_content_size").alter().nullable();
    });

    await knex.schema.alterTable("load_test_route_specific_data", (table) => {
        table.float("median_response_time").alter().nullable();
        table.float("average_response_time").alter().nullable();
        table.float("min_response_time").alter().nullable();
        table.float("max_response_time").alter().nullable();
        table.float("avg_content_size").alter().nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.alterTable("load_test_requests", (table) => {
        table.integer("median_response_time").alter().nullable();
        table.integer("average_response_time").alter().nullable();
        table.integer("min_response_time").alter().nullable();
        table.integer("max_response_time").alter().nullable();
        table.integer("avg_content_size").alter().nullable();
        table.integer("requests_per_second").alter().nullable();
        table.integer("failures_per_second").alter().nullable();
    });

    await knex.schema.alterTable("load_test_requests_final", (table) => {
        table.integer("median_response_time").alter().nullable();
        table.integer("average_response_time").alter().nullable();
        table.integer("min_response_time").alter().nullable();
        table.integer("max_response_time").alter().nullable();
        table.integer("avg_content_size").alter().nullable();
    });

    await knex.schema.alterTable("load_test_route_specific_data", (table) => {
        table.integer("median_response_time").alter().nullable();
        table.integer("average_response_time").alter().nullable();
        table.integer("min_response_time").alter().nullable();
        table.integer("max_response_time").alter().nullable();
        table.integer("avg_content_size").alter().nullable();
    });
};