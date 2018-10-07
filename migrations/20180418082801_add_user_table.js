exports.up = async function (knex, Promise) {
    await knex.schema.createTable("user", (table) => {
        table.increments();

        table.text("email");
        table.text("password");
        table.text("first_name");
        table.text("last_name");

        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("user");
};
