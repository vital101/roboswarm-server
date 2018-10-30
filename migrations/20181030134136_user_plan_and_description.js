exports.up = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.string("stripe_plan_id").defaultTo("change_me");
        table.string("stripe_plan_description").defaultTo("change_me");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.dropColumn("stripe_plan_id");
        table.dropColumn("stripe_plan_description");
    });
}