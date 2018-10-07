exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.text("file_path");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("file_path");
    });
};
