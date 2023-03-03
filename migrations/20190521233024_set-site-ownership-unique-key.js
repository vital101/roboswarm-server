exports.up = async function (knex, Promise) {
    await knex.schema.table("site_ownership", table => {
        table.unique("ROBOSWARM__BASE_URL");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("site_ownership", table => {
        table.dropUnique("ROBOSWARM__BASE_URL");
    });
};