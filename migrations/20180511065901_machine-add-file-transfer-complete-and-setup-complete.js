exports.up = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.boolean("setup_complete").defaultTo(false);
        table.boolean("file_transfer_complete").defaultTo(false);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.dropColumn("setup_complete");
        table.dropColumn("file_transfer_complete");
    });
};