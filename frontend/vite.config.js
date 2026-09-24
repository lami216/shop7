import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
        plugins: [react()],
        define: {
                "import.meta.env.VITE_BUILD_TIME": JSON.stringify(new Date().toISOString()),
        },
        server: {
                proxy: {
                        "/api": {
                                target: "http://127.0.0.1:10007",
                        },
                },
        },
});
