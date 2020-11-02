exports.up = async function (knex, Promise) {
    await knex.schema.table("load_test_template_woo_commerce", (table) => {
        table.boolean("active").default(true);
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("load_test_template_woo_commerce", (table) => {
        table.dropColumn("active");
    });
};