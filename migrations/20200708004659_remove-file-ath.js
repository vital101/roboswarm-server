exports.up = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("file_path");
    });
};

exports.down = function (knex) {
};
