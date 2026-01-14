import { GridEvents } from "../../src/components/events/gridEvents.js";
import { expect } from '@esm-bundle/chai';

describe("GridEvents", function () {
    let feature = null

    beforeEach(function() {
        feature = new GridEvents();
    });

    describe("chain", function () {
        it("result of callbacks in order for subscriber", function () {
            const chain1 = function(params) { params.chain1 = "hello"; return params; };
            const chain2 = function(params) { params.chain2 = "world"; return params; };

            feature.subscribe("chain", chain2, false, 1);
            feature.subscribe("chain", chain1, false, 0);
            const actual = feature.chain("chain", {});
            
            expect(actual.chain1).to.equal("hello");
            expect(actual.chain2).to.equal("world");
        });
    });

    describe("trigger", function () { 
        it("executes callbacks in order for subscriber", function () {
            let actual1 = "";
            let actual2 = "";
            const call1 = () => { actual1 = "hello"; };
            const call2 = () => { actual2 = "world"; };

            feature.subscribe("trigger", call2, false, 1);
            feature.subscribe("trigger", call1, false, 0);
            feature.trigger("trigger", {});
            
            expect(actual1).to.equal("hello");
            expect(actual2).to.equal("world");
        });

        it("executes mixed sync and async events in order", async function () {
            let actual1 = "";
            let actual2 = "";
            let actual3 = "";
            const call1 = () => { actual1 = "hello"; };
            const call2 = async () => { actual2 = await "world"; };
            const call3 = () => { actual3 = "!!!"; };

            feature.subscribe("trigger", call2, true, 1);
            feature.subscribe("trigger", call1, true, 0);
            feature.subscribe("trigger", call3, true, 3);
            await feature.trigger("trigger", {});
            
            expect(actual1).to.equal("hello");
            expect(actual2).to.equal("world");
            expect(actual3).to.equal("!!!");
        });
    });

    describe("unsubscribe", function () {
        it("removes the target event from the publication chain", function () {
            let actual1 = "";
            let actual2 = "";
            const call1 = () => { actual1 = "hello"; };
            const call2 = () => { actual2 = "world"; };

            feature.subscribe("trigger", call2, false, 1);
            feature.subscribe("trigger", call1, false, 0);
            feature.unsubscribe("trigger", call1);
            feature.trigger("trigger", {});
            
            expect(actual1).to.equal("");
            expect(actual2).to.equal("world");
        });
    });
});