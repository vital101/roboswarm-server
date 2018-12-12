exports.up = async function (knex, Promise) {
    await knex.schema.table("load_test_requests", (table) => {
        table.integer("failures_per_second").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("load_test_requests", (table) => {
        table.dropColumn("failures_per_second");
    });
};