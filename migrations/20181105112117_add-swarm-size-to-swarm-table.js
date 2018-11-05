exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.integer("size").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("size");
    });
};