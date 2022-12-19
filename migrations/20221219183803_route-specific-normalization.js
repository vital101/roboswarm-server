exports.up = async function (knex, Promise) {
    await knex.schema.createTable("http_method", (table) => {
        table.increments();
        table.text("method");
        table.index("method");
    });

    await knex.schema.createTable("route", (table) => {
        table.increments();
        table.text("route");
    });
};

exports.down = async function (knex, Promise) {
};