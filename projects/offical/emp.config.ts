import { defineConfig } from "@empjs/cli";
import pluginReact from "@empjs/plugin-react";
// import lightningcssPlugin from '@empjs/plugin-lightningcss'
export default defineConfig(() => {
	return {
		plugins: [pluginReact()],
		html: {
			template: "src/index.html",
		},
		server: {
			port: 3001,
			open: false,
		},
	};
});
