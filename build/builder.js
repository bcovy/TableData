import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";

const fs  = require("fs-extra");

class Builder {
    constructor(env) {
        this.bundles = [];
        this.env = env;
    }

    bundle() {
        console.log("Building dev package bundles: ", this.env);

        switch(this.env) {
            case "js":
                this.bundleScripts();
                break;
            case "esm":
                this.bundleEms();
                break;
            case "cssmin":
                this.bundleCssMin();
                break;
            case "scss":
                this.bundleCss();
                break;
            default:
                console.error("Select a valid item.");
                break;
        }
        
        return this.bundles;
    }

    bundleScripts() {
        this.bundles.push({
            input: "src/builds/full.js",
            output: [{
                file: "dist/tabledata.js",
                format: "esm",
                generatedCode: { constBindings: true },
                sourcemap: "inline"
            }, {
                file: "dist/tabledata.min.js",
                format: "esm",
                generatedCode: { constBindings: true },
                plugins: [ terser({ module: false, toplevel: false })]
                }],
            treeshake: false
        });
    }

    bundleEms() {
        this.bundles.push({
            input: "src/builds/ems.js",
            output: {
                file: "dist/tabledata_ems.js",
                format: "esm",
                exports: "named",
                sourcemap: "inline",
                generatedCode: { constBindings: true }
            },
            treeshake: false
        });
    }

    bundleCss() {
        fs.removeSync("./dist/tabledata.css");

        this.bundles.push({
            input: "src/css/appstyles.scss", 
            output: [
                { file: "dist/tabledata.css", format: "es" }
            ],
            plugins: [
                postcss({ 
                    modules: false,
                    extract: true,
                    minimize: false,
                    sourceMap: false
                })
            ]
        });
    }

    bundleCssMin() {
        fs.removeSync("./dist/tabledata.min.css");

        this.bundles.push({
            input: "src/css/appstyles.scss", 
            output: { 
                file: "dist/tabledata.min.css",
                format: "es"
            },
            plugins: [
                postcss({ 
                    modules: false,
                    extract: true,
                    minimize: true,
                    sourceMap: false
                })
            ]
        });
    }
}

export { Builder };