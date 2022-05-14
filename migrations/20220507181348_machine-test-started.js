exports.up = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.boolean("test_started").default(false);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.dropColumn("test_started");
    });
};