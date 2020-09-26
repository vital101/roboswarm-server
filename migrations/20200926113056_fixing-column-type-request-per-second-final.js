exports.up = async function (knex, Promise) {
    await knex.schema.table("load_test_requests_final", (table) => {
        table.float('requests_per_second').alter();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("load_test_requests_final", (table) => {
        table.integer('requests_per_second').alter();
    });
};