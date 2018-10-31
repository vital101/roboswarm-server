exports.up = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.boolean("is_delinquent").defaultTo(false)
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.dropColumn("is_delinquent");
    });
}