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

    describe("getAttributes", () => {
        test("returns an empty array if there are no query params on the URL", () => {
            const routePath = "/some/url";
            const attributes = templateGeneration.getAttributes(routePath);
            expect(attributes.length).toBe(0);
        });

        test("returns an array of attributes based on the querystring", () => {
            const routePath = "/some/url?color=green&size=10";
            const attributes = templateGeneration.getAttributes(routePath);
            expect(attributes).toHaveLength(2);
            expect(attributes[0]).toStrictEqual({
                name: "color",
                value: "green"
            });
            expect(attributes[1]).toStrictEqual({
                name: "size",
                value: "10"
            });
        });
    });
});