exports.up = async function (knex, Promise) {
    await knex.schema.table("load_test_requests", (table) => {
        table.integer("user_count").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("load_test_requests", (table) => {
        table.dropColumn("user_count");
    });
};