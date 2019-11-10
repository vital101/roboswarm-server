exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.text("template_id").nullable();
        table.text("template_name").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("template_id");
        table.dropColumn("template_name");
    });
};
