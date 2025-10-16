import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
	onSuccess: async () => {
		// Copy injected JavaScript files to dist
		const targetDir = join(__dirname, "dist", "cli", "injected");
		mkdirSync(targetDir, { recursive: true });

		const files = [
			"event-capture-client.js",
			"recording-ui-client.js",
		];

		for (const file of files) {
			const src = join(__dirname, "src", "recorder", "injected", file);
			const dest = join(targetDir, file);
			copyFileSync(src, dest);
			console.log(`✓ Copied ${file} to dist/cli/injected/`);
		}
	},
});
