import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		"cli/index": "src/cli/index.ts",
	},
	outDir: "dist",
	format: ["esm"],
	platform: "node",
	target: "esnext",
	dts: true,
	sourcemap: true,
	clean: true,
	splitting: false,
	noExternal: [],
	treeshake: true,
	bundle: true, // Enable bundling to resolve path aliases
});
