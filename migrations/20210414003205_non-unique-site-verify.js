exports.up = async function (knex, Promise) {
    await knex.schema.table("site_ownership", (table) => {
        table.dropUnique("base_url");
    });

    await knex.schema.table("site_ownership", (table) => {
        table.unique(["user_id", "group_id", "base_url"]);
    });
};

exports.down = async function (knex, Promise) { };