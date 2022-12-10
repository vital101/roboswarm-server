exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.boolean("should_send_final_data").default(false);
        table.boolean("final_data_sent").default(false);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("should_send_final_data");
        table.dropColumn("final_data_sent");
    });
};