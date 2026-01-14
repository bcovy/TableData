import { HeaderCell } from "../../src/components/cell/headerCell.js";
import { Fixtures } from "../fixtures/fixtures.js";
import { expect } from '@esm-bundle/chai';

describe("HeaderCell", function() {
    const settings = Fixtures.getSettings();

    describe("constructor", function() { 
        it("creates th element with child span", function () {
            const feature = new HeaderCell({ field: "id", type: "number", settings: settings });
            
            expect(feature.element.firstChild.nodeName).to.equal("SPAN");
        });
    });
    
    describe("setSortFlag/removeSortFlag", function() { 
        let feature;
        
        beforeEach(function() {
            feature = new HeaderCell({ field: "id", type: "number", settings: settings });
        });

        it("set desc sort icon in span title", function () {
            feature.span.context.setSortFlag();

            expect(feature.span.lastChild.nodeName).to.equal("I");
            expect(feature.span.lastChild.className).to.contain("desc");
        });

        it("set asc sort icon in span title", function () {
            feature.directionNext = "asc"
            feature.span.context.setSortFlag();

            expect(feature.span.lastChild.nodeName).to.equal("I");
            expect(feature.span.lastChild.className).to.contain("asc");
        });

        it("removeSortFlag resets cell back to default", function () {
            feature.span.context.setSortFlag();
            expect(feature.isCurrentSort).to.be.true;
            expect(feature.directionNext).to.equal("asc");
            feature.span.context.removeSortFlag();

            expect(feature.direction).to.equal("desc");
            expect(feature.directionNext).to.equal("desc");
            expect(feature.span.context.isCurrentSort).to.be.false;
        });
    });
});