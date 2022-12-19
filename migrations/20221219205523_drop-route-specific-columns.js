exports.up = async function (knex, Promise) {
    await knex.schema.alterTable("load_test_route_specific_data", (table) => {
        table.dropColumn("route");
        table.dropColumn("method");
    });
};

exports.down = async function (knex, Promise) {

};