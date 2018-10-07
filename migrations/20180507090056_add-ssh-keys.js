exports.up = async function (knex, Promise) {
    await knex.schema.createTable("ssh_key", (table) => {
        table.increments();

        table.text("public");
        table.text("private");
        table.text("external_id");

        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("destroyed_at").nullable();
    });
    await knex.schema.table("swarm", (table) => {
        table.integer("ssh_key_id");;
        table.foreign("ssh_key_id").references("ssh_key.id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("ssh_key_id");
    });
    await knex.schema.dropTable("ssh_key");
};
