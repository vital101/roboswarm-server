exports.up = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.string("stripe_card_id").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.dropColumn("stripe_card_id");
    });
}