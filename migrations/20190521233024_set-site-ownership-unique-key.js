exports.up = async function (knex, Promise) {
    await knex.schema.table("site_ownership", table => {
        table.unique("base_url");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("site_ownership", table => {
        table.dropUnique("base_url");
    });
};