exports.up = async function (knex, Promise) {
    await knex.schema.createTable("template_blob", table => {
        table.increments();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.integer("user_id");
        table.integer("group_id");
        table.text("template");

        table.foreign("user_id").references("user.id");
        table.foreign("group_id").references("group.id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("template_blob");
};