exports.up = async function (knex, Promise) {
    await knex.schema.createTable("machine", (table) => {
        table.increments();

        table.text("name");
        table.text("tag");
        table.text("region");
        table.integer("memory");
        table.integer("vcpus");
        table.integer("disk");

        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("ready_at").nullable();
        table.timestamp("destroyed_at").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("machine");
};
