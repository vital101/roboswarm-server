exports.up = async function (knex, Promise) {
    await knex.schema.createTable("load_test_template_woo_commerce", table => {
        table.increments();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.integer("user_id");
        table.integer("group_id");
        table.integer("file_path");
        table.text("name");
        table.text("site_url");

        table.foreign("user_id").references("user.id");
        table.foreign("group_id").references("group.id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_template_woo_commerce");
};