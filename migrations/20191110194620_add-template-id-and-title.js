exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", table => {
        table.index("group_id");
        table.index("soft_delete");
    });

    await knex.schema.table("swarm_machine", table => {
        table.index("swarm_id");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", table => {
        table.dropIndex("group_id");
        table.dropIndex("soft_delete");
    });

    await knex.schema.table("swarm_machine", table => {
        table.dropIndex("swarm_id");
    });
};
