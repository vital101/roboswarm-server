import * as templateGeneration from "../../src/lib/templateGeneration";

describe("lib/templateGeneration", () => {
    describe("getRoutePath", () => {
        test("generates valid route paths", () => {
            const routes = [
                {
                    route: "/some-path",
                    expected: "/some-path"
                },
                {
                    route: "some-path",
                    expected: "/some-path"
                }
            ];
            for (const route of routes) {
                const result = templateGeneration.getRoutePath(route.route);
                expect(result).toBe(route.expected);
            }
        });
    });
});