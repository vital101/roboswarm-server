exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.boolean("soft_delete").default(false);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("soft_delete");
    });
};