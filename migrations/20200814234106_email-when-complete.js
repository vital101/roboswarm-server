exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.boolean("email_when_complete").default(false);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("email_when_complete");
    });
};