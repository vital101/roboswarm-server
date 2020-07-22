exports.up = async function (knex, Promise) {
    await knex.schema.createTable("password_reset_nonce", table => {
        table.increments();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.integer("user_id");
        table.text("nonce");
        table.boolean("valid");

        table.foreign("user_id").references("user.id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("password_reset_nonce");
};