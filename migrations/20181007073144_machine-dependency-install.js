exports.up = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.boolean("dependency_install_complete").defaultTo(false);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.dropColumn("dependency_install_complete");
    });
};