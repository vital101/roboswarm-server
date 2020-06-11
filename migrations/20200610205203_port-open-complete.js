exports.up = async function (knex, Promise) {
    await knex.schema.table("machine", (table) => {
        table.boolean("port_open_complete").defaultTo(false);
    });
};

exports.down = function(knex) {
};
