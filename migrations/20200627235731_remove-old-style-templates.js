exports.up = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_template_route");
    await knex.schema.dropTable("load_test_template");
};

exports.down = async function (knex, Promise) { };