import { SettingsGrid } from "../../src/settings/settingsGrid.js";
import defaults from "../../src/settings/settingsDefault.js";
import { expect } from '@esm-bundle/chai';

describe("SettingsGrid", function() {
    let options = null;

    beforeEach(function() {
        options = structuredClone(defaults);
        options.columns = [
            { field: "id", type: "number" },
            { field: "name", label: "Some Name", type: "string" },
            { field: "pcoe", label: "PCOE", type: "date", headerCss: "some-rule" },
            { field: "task", type: "datetime", headerCss: "some-rule" },
            { field: "comments", type: "string" }
        ];
    });

    it("should set remote sort properties using first column with field property", function() {
        options.remoteProcessing = true;
        options.columns = [
            { formatter: "icon", type: "number" },
            { field: "ssn", type: "number" }
        ];

        const feature = new SettingsGrid(options);

        expect(feature.remoteProcessing).to.be.true;
        expect(feature.remoteSortDefaultColumn).to.equal("ssn");
        expect(feature.remoteSortDefaultDirection).to.equal("desc");
    });

    it("should set remote sort properties using user input", function() {
        options.remoteProcessing = { column: "name", direction: "asc" };

        const feature = new SettingsGrid(options);

        expect(feature.remoteProcessing).to.be.true;
        expect(feature.remoteSortDefaultColumn).to.equal("name");
        expect(feature.remoteSortDefaultDirection).to.equal("asc");
    });

    it("should set remote processing to false when input is false", function() {
        const feature = new SettingsGrid(options);

        expect(feature.remoteProcessing).to.be.false;
    });

    it("_buildAjaxUrl creates ajaxUrl without parameters", function() {
        const feature = new SettingsGrid(options);

        const actual = feature._buildAjaxUrl("http://example.com", "");

        expect(actual).to.equal("http://example.com");
    });

    it("_buildAjaxUrl creates ajaxUrl with parameters", function() {
        const feature = new SettingsGrid(options);

        const actual = feature._buildAjaxUrl("http://example.com", { id: 1, address: "street" });

        expect(actual).to.equal("http://example.com?id=1&address=street");
    });
});