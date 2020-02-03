import * as Machine from "../../src/models/Machine";

describe("models/Machine", () => {

    describe("getDigitalOceanMachineImageId", () => {
        test("returns the correct imageId", () => {
            const regionImagePairs = [
                { region: "blr1", imageId: 58697556 },
                { region: "tor1", imageId: 58697422 },
                { region: "fra1", imageId: 58695099 },
                { region: "lon1", imageId: 58694987 },
                { region: "sgp1", imageId: 58694917 },
                { region: "ams3", imageId: 58668113 },
                { region: "sfo2", imageId: 58667614 },
                { region: "nyc3", imageId: 58667140 },
                { region: "badRegion", imageId: 58667140 }
            ];

            regionImagePairs.forEach(pair => {
                expect(Machine.getDigitalOceanMachineImageId(pair.region)).toEqual(pair.imageId);
            })
        });
    });

});