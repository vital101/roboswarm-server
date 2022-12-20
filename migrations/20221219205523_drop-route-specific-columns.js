exports.up = async function (knex, Promise) {
    // Only run this in dev. In prod we will do it manually.
    if (process.env.NODE_ENV !== "production") {
        await knex.schema.alterTable("load_test_route_specific_data", (table) => {
            table.dropColumn("route");
            table.dropColumn("method");
        });
    }
};

exports.down = async function (knex, Promise) {

};