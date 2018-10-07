exports.up = async function (knex, Promise) {
    await knex.schema.createTable("swarm_machine", (table) => {
        table.integer("swarm_id");
        table.integer("machine_id");

        table.foreign("swarm_id").references("swarm.id");
        table.foreign("machine_id").references("machine.id");

        table.unique(["swarm_id", "machine_id"]);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.dropTable("swarm_machine");
};