import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
const src = path.join(process.cwd(), "src");
export default defineConfig(({ mode }) => {
	return {
		resolve: {
			alias: [
				{ find: /^~/, replacement: "" },
				{ find: "src/", replacement: path.join(src, "/").replace(/\\/gi, "/") },
			],
		},
		plugins: [react()],

		server: {
			port: 3002,
			host: true,
		},
		preview: {
			port: 3002,
			host: true,
		},
	};
});
