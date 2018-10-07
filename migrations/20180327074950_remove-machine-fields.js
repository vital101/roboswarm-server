exports.up = async function (knex, Promise) {
    await knex.schema.alterTable("machine", (table) => {
        table.dropColumn("name");
        table.dropColumn("tag");
        table.dropColumn("region");
        table.dropColumn("memory");
        table.dropColumn("vcpus");
        table.dropColumn("disk");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.alterTable("machine", (table) => {
        table.text("name");
        table.text("tag");
        table.text("region");
        table.integer("memory");
        table.integer("vcpus");
        table.integer("disk");
    });
};