import { defineConfig } from "@ub/bell-pkg";

export default defineConfig({
	bundle: {
		filename: "execa",
	},
	transform: {
		formats: ["cjs"],
	},
});
