exports.up = async function (knex, Promise) {
    await knex.schema.createTable("swarm", (table) => {
        table.increments();

        table.integer("group_id");
        table.integer("user_id");
        table.text("name");

        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("ready_at").nullable();
        table.timestamp("destroyed_at").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("swarm");
};
