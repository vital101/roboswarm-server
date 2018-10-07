exports.up = async function (knex, Promise) {
    await knex.schema.alterTable("machine", (table) => {
        table.integer("external_id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.alterTable("machine", (table) => {
        table.dropColumn("external_id");
    });
};