import { db } from "../../src/lib/db";

describe("lib/db", () => {
    describe("db", () => {
        test("exports an instantiated db instance", async () => {
            expect(db.raw).toBeInstanceOf(Function);
        });
    });

});