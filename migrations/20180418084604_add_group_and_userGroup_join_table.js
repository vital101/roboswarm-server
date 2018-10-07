exports.up = async function (knex, Promise) {
    await knex.schema.createTable("group", (table) => {
        table.increments();
        table.text("name");
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });

    await knex.schema.createTable("usergroup", (table) => {
        table.integer("user_id");
        table.integer("group_id");

        table.foreign("user_id").references("user.id");
        table.foreign("group_id").references("group.id");

        table.unique(["user_id", "group_id"]);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("usergroup");
    await knex.schema.dropTable("group");
};
