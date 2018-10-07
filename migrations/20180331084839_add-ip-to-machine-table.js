exports.up = async function (knex, Promise) {
    await knex.schema.alterTable("machine", (table) => {
        table.string("ip_address");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.alterTable("machine", (table) => {
        table.dropColumn("ip_address");
    });
};