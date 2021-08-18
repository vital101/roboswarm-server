exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.text("user_traffic_behavior").default("evenSpread");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("user_traffic_behavior");
    });
};