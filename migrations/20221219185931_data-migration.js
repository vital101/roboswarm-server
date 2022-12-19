exports.up = async function (knex, Promise) {
    const methodCount = await knex.select("*").from("http_method");
    if (methodCount.length === 0) {
        await knex.insert([
            { method: "GET" },
            { method: "POST" },
            { method: "PUT" },
            { method: "PATCH" },
            { method: "DELETE" },
            { method: "OPTIONS" }
        ]).into("http_method");
    }
    const httpMethods = await knex.select("*").from("http_method");
    const countRow= await knex("load_test_route_specific_data").count();
    const routeCount = Number(countRow[0].count);
    const batchSize = 1000;
    let totalProcessed = 0;
    while (totalProcessed < routeCount) {
        console.log(`${totalProcessed} < ${routeCount}`);
        const rows = await knex("load_test_route_specific_data")
            .orderBy("id")
            .limit(batchSize)
            .offset(totalProcessed);
        for(let i = 0; i < rows.length; i++) {
            const method_id = httpMethods.find(m => m.method = rows[i].method).id;
            let matchingRoutes = await knex("route").where({ route: rows[i].route });
            if (!matchingRoutes || matchingRoutes.length === 0) {
                await knex("route")
                    .insert({ route: rows[i].route });
                matchingRoutes = await knex("route").where({ route: rows[i].route });
            }
            const route_id = matchingRoutes[0].id;
            await knex("load_test_route_specific_data").update({
                route_id,
                method_id
            }).where({ id: rows[i].id });
        }
        totalProcessed += batchSize;
    }
};

exports.down = async function (knex, Promise) {

};
