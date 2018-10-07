exports.up = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.unique("email");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("user", (table) => {
        table.dropUnique("email");
    });
};
