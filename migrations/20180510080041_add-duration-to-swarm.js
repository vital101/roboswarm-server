exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.text("duration");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("duration");
    });
};