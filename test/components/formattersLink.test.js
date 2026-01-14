import { FormatLink } from "../../src/components/cell/formatters/link.js";
import { expect } from '@esm-bundle/chai';

describe("FormatLink", function () {
    const data = { id: 7, name: "Abc CANELL" };

    it("creates anchor tag element", function () {
        const input = {
            urlPrefix: "./example",
            innerText: "hello world"
        };

        const actual = FormatLink.apply(data, input);

        expect(actual.nodeName).to.equal("A");
    });

    it("uses innerText property and has basic url", function () {
        const input = {
            urlPrefix: "./example",
            innerText: "hello world"
        };

        const actual = FormatLink.apply(data, input);

        expect(actual.href).to.contain("/example");
        expect(actual.innerHTML).to.equal("hello world");
    });

    it("uses innerText function type property for inner html", function () {
        const input = {
            urlPrefix: "./example",
            innerText: function(rowData, formatterParams) {
                return rowData.name;
            }
        };

        const actual = FormatLink.apply(data, input);

        expect(actual.href).to.contain("/example");
        expect(actual.innerHTML).to.equal("Abc CANELL");
    });

    it("uses fieldText property for inner html", function () {
        const input = {
            urlPrefix: "./example",
            fieldText: "name"
        };

        const actual = FormatLink.apply(data, input);

        expect(actual.innerHTML).to.equal("Abc CANELL");
    });

    it("applies routeField value to element's href property", function () {
        const input = {
            urlPrefix: "./example",
            innerText: "hello world", 
            routeField: "id"
        };

        const actual = FormatLink.apply(data, input);

        expect(actual.href).to.contain("/example/7");
    });

    it("applies queryField property to elements href property", function () {
        const input = {
            urlPrefix: "./example",
            innerText: "hello world",
            queryField: "name"
        };

        const actual = FormatLink.apply(data, input);

        expect(actual.href).to.contain("/example?name=Abc%20CANELL");
    });

    it("applies routeField and queryField properties to elements href property", function () {
        const input = {
            urlPrefix: "./example",
            innerText: "hello world",
            routeField: "id",
            queryField: "name"
        };

        const actual = FormatLink.apply(data, input);

        expect(actual.href).to.contain("/example/7?name=Abc%20CANELL");
    });
});