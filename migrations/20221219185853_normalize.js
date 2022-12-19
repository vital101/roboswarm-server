exports.up = async function (knex, Promise) {
    await knex.schema.alterTable("load_test_route_specific_data", (table) => {
        table.integer("method_id").nullable();
        table.foreign("method_id").references("http_method.id");
        table.integer("route_id").nullable();
        table.foreign("route_id").references("route.id");
        table.index("route_id");
        table.index("method_id");
    });
};

exports.down = async function (knex, Promise) {
    
};