exports.up = async function (knex, Promise) {
    await knex.schema.alterTable("load_test_route_specific_data", (table) => {
        table.float("requests_per_second").alter().nullable();
        table.float("failures_per_second").alter().nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.alterTable("load_test_route_specific_data", (table) => {
        table.integer("requests_per_second").alter().nullable();
        table.integer("failures_per_second").alter().nullable();
    });
};