import { DataLoader } from "../../src/components/data/dataLoader.js";
import { expect } from '@esm-bundle/chai';

describe("DataLoader", function() {
    describe("buildUrl", function() {   
        it("with no remote parameters returns url with query string", function() {
            const feature = new DataLoader({ ajaxUrl: "http://example.com" });

            const result = feature.buildUrl(feature.ajaxUrl, { state: "ca", id: 1 });

            expect(result).to.equal("http://example.com?state=ca&id=1");
        });

        it("with remote parameters returns url with query string", function() {
            const feature = new DataLoader({ 
                ajaxUrl: "http://example.com?id=1&address=street"
            });

            const result = feature.buildUrl(feature.ajaxUrl, { state: "ca" });

            expect(result).to.equal("http://example.com?id=1&address=street&state=ca");
        });

        it("with parameters that contains an array type", function() {
            const feature = new DataLoader({ 
                ajaxUrl: "http://example.com"
            });

            const result = feature.buildUrl(feature.ajaxUrl, { state: ["ca", "az"] });

            expect(result).to.equal("http://example.com?state=ca&state=az");
        });

        it("with parameters that contains an array and single string", function() {
            const feature = new DataLoader({ 
                ajaxUrl: "http://example.com"
            });

            const result = feature.buildUrl(feature.ajaxUrl, { id: 1, state: ["ca", "az"] });

            expect(result).to.equal("http://example.com?id=1&state=ca&state=az");
        });

        it("with no input parameters returns base url", function() {
            const feature = new DataLoader({ ajaxUrl: "http://example.com" });

            const result = feature.buildUrl(feature.ajaxUrl);

            expect(result).to.equal("http://example.com");
        });
    });
});