exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.text("region");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("region");
    });
};