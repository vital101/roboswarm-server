exports.up = async function (knex, Promise) {
    await knex.schema.table("load_test_template_woo_commerce", (table) => {
        table.dropColumn("file_path");
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("load_test_template_woo_commerce", (table) => {
        table.text("file_path").nullable();
    });
};