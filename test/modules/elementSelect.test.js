import { ElementSelect } from "../../src/modules/filter/elements/elementSelect.js";
import { Fixtures } from "../fixtures/fixtures.js";
import { expect } from '@esm-bundle/chai';

describe("ElementSelect", function() {
    let column = null;

    beforeEach(function() {
        column = { 
            field: "id", 
            type: "string", 
            filterType: "equals", 
            filterCss: "css",
            settings: Fixtures.getSettings()
        };
    });

    describe("constructor", function() { 
        it("sets select options from filterValues property of type object", function() {
            column.filterValues = {1: "ca", 2: "az" };
            
            const feature = new ElementSelect(column, Fixtures.getContext());

            expect(feature.element.nodeName).to.equal("SELECT");
            expect(feature.element.options.length).to.equal(3);
            expect(feature.element.options[1].text).to.equal("ca");
            expect(feature.element.options[1].value).to.equal("1");
        });

        it("sets select options and preserves order from filterValues property of type array object", function() {
            column.filterValues = [{ value: 2, text: "az" }, { value: 1, text: "ca" }];
            
            const feature = new ElementSelect(column, Fixtures.getContext());

            expect(feature.element.nodeName).to.equal("SELECT");
            expect(feature.element.options.length).to.equal(3);
            expect(feature.element.options[2].text).to.equal("ca");
            expect(feature.element.options[2].value).to.equal("1");
        });

        it("sets select options from filterValuesRemoteSource property", function() {
            column.filterValuesRemoteSource = "someurl";

            const feature = new ElementSelect(column, Fixtures.getContext());

            expect(feature.element.nodeName).to.equal("SELECT");
        });
    });

    describe("createSelectOptions", function() { 
        it("creates option elements from data set", function() {
            column.filterValuesRemoteSource = "someurl";

            const feature = new ElementSelect(column, Fixtures.getContext());
            feature.createSelectOptions([{value: 1, text: "ca" }]);

            expect(feature.element.options.length).to.equal(2);
            expect(feature.element.options[1].text).to.equal("ca");
            expect(feature.element.options[1].value).to.equal("1");
        });
    });

    describe("refreshSelectOptions", function() { 
        it("refreshes options with updated data set", function() {
            column.filterValues = {1: "ca", 2: "az" };
            
            const feature = new ElementSelect(column, Fixtures.getContext());
            expect(feature.element.options.length).to.equal(3);
            feature.refreshSelectOptions([{value: 1, text: "ca" }]);

            expect(feature.element.options.length).to.equal(2);
        });

        it("refreshes options and persist selected value", function() {
            column.filterValues = {1: "ca", 2: "az" };
            
            const feature = new ElementSelect(column, Fixtures.getContext());
            feature.element.value = "1";
            feature.refreshSelectOptions([{value: 1, text: "ca" }]);

            expect(feature.element.value).to.equal("1");
        });
    });
});