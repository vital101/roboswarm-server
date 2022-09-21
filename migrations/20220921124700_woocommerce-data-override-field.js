exports.up = async function (knex, Promise) {
    await knex.schema.table("load_test_template_woo_commerce", (table) => {
        table.text("data_override").nullable();
    });
};

exports.down = async function (knex, Promise) {
    await knex.schema.table("swarm", (table) => {
        table.dropColumn("data_override");
    });
};