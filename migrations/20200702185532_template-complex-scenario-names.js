exports.up = async function (knex, Promise) {
    await knex.schema.table("load_test_template_complex", (table) => {
        table.text("scenario_names").defaultTo("");
    });
};

exports.down = function (knex) {
};
