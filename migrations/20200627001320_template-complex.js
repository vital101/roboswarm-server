exports.up = async function (knex, Promise) {
    await knex.schema.createTable("load_test_template_complex", (table) => {
        table.increments();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.integer("group_id");
        table.integer("user_id");
        table.text("name");
        table.text("site_url").nullable();
        table.text("username").nullable();
        table.text("password").nullable();
        table.text("routes");

        table.foreign("group_id").references("group.id");
        table.foreign("user_id").references("user.id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_template_complex");
};