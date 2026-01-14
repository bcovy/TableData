import options from "../../src/settings/settingsDefault.js";
import { MergeOptions } from "../../src/settings/mergeOptions.js";
import { expect } from '@esm-bundle/chai';

describe("MergeOptions", function() {
    it("should not mutate default options", function() {
        let source = { enablePaging: false, pagerPagesToDisplay: 7 };

        const actual = MergeOptions.merge(source);

        expect(options.enablePaging).to.equal(options.enablePaging);
    });

    it("should merge user options with defaults", function() {
        let source = { enablePaging: false, pagerPagesToDisplay: 7 };

        const actual = MergeOptions.merge(source);

        expect(actual.enablePaging).to.equal(source.enablePaging);
        expect(actual.pagerPagesToDisplay).to.equal(source.pagerPagesToDisplay);
    });

    it("should return default when input is empty", function() {
        const actual = MergeOptions.merge({});

        expect(actual.enablePaging).to.equal(options.enablePaging);
        expect(actual.pagerPagesToDisplay).to.equal(options.pagerPagesToDisplay);
    });

    it("should merge key/value pairs value type", function() {
        let source = { remoteParams: { days: "hello", months: "world" }, tableStyleSettings: { fontSize: "13px" } };

        const actual = MergeOptions.merge(source);

        expect(actual.remoteParams.days).to.equal("hello");
        expect(actual.remoteParams.months).to.equal("world");
        expect(actual.tableStyleSettings).to.be.instanceOf(Object);
        expect(actual.tableStyleSettings.fontSize).to.equal("13px");
    });
});