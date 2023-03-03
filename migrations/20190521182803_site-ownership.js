exports.up = async function (knex, Promise) {
    await knex.schema.createTable("site_ownership", (table) => {
        table.increments();

        table.integer("group_id");
        table.integer("user_id");
        table.text("ROBOSWARM__BASE_URL");
        table.uuid("uuid");
        table.boolean("verified").defaultTo(false);

        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("site_ownership");
};