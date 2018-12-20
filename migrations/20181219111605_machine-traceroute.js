exports.up = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.text("traceroute").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.dropColumn("traceroute");
    });
};