exports.up = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.string("stripe_id").defaultTo("change_me");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.dropColumn("stripe_id");
    });
};