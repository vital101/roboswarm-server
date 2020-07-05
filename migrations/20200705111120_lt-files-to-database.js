const fs = require("fs");

function asyncReadFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}

exports.up = async function (knex, Promise) {
    const rows = await knex("swarm");
    for (let r of rows) {
        if (fs.existsSync(r.file_path)) {
            const fileBuffer = await asyncReadFile(r.file_path);
            await knex("load_test_file").insert({
                swarm_id: r.id,
                lt_file: fileBuffer
            });
            console.log(`File ${r.file_path} converted to db file.`);
        } else {
            console.log(`File ${r.file_path} does not exist. Skipping.`);
        }
    }
};

exports.down = function (knex) {
};
