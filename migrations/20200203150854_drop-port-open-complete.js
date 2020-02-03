exports.up = async function (knex, Promise) {
    await knex.schema.table("machine", table => {
         table.dropColumn("port_open_complete");
    });
};

exports.down = async function (knex, Promise) {
};
