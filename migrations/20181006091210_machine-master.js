exports.up = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.boolean("is_master").defaultTo(false);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.dropColumn("is_master");
    });
};