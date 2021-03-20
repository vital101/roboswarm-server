import * as templateGeneration from "../../src/lib/templateGeneration";

describe("lib/templateGeneration", () => {
    describe("getRoutePath", () => {
        test("generates valid route paths", () => {
            const routes = [
                {
                    basePath: "https://kernl.us/",
                    route: "/some-path",
                    expected: "some-path"
                },
                {
                    basePath: "https://kernl.us",
                    route: "some-path",
                    expected: "/some-path"
                }
            ];
            for (const route of routes) {
                const result = templateGeneration.getRoutePath(route.basePath, route.route);
                expect(result).toBe(route.expected);
            }
        });
    });
});