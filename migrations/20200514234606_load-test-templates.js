exports.up = async function (knex, Promise) {
    await knex.schema.createTable("load_test_template", (table) => {
        table.increments();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.integer("group_id");
        table.integer("user_id");
        table.text("name");

        table.foreign("group_id").references("group.id");
        table.foreign("user_id").references("user.id");
    });

    await knex.schema.createTable("load_test_template_route", (table) => {
        table.increments();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.integer("load_test_template_id");
        table.string("method");
        table.string("path");

        table.foreign("load_test_template_id").references("load_test_template.id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("load_test_template");
    await knex.schema.dropTable("load_test_template_route");
};