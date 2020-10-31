exports.up = async function (knex, Promise) {
    await knex.schema.table("load_test_template_woo_commerce", (table) => {
        table.text("shop_url").nullable();
        table.text("cart_url").nullable();
        table.text("checkout_url").nullable();
        table.text("product_a_url").nullable();
        table.text("product_b_url").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("load_test_template_woo_commerce", (table) => {
        table.dropColumn("shop_url");
        table.dropColumn("cart_url");
        table.dropColumn("checkout_url");
        table.dropColumn("product_a_url");
        table.dropColumn("product_b_url");
    });
};