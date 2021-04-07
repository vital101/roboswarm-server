exports.up = async function (knex, Promise) {
    const hasTemplateID = await knex.schema.hasColumn("swarm", "template_id");
    if (!hasTemplateID) {
        await knex.schema.table("swarm", (table) => {
            table.text("template_id").nullable();
        });
    }

    const hasTemplateName = await knex.schema.hasColumn("swarm", "template_name");
    if (!hasTemplateName) {
        await knex.schema.table("swarm", (table) => {
            table.text("template_name").nullable();
        });
    }
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("template_id");
        table.dropColumn("template_name");
    });
};