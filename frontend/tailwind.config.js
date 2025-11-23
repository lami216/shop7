/** @type {import('tailwindcss').Config} */
export default {
        content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
        theme: {
                extend: {
                        colors: {
                                "payzone-navy": "#0E2748",
                                "payzone-white": "#FFFFFF",
                                "payzone-gold": "#D29C4A",
                                "payzone-indigo": "#4B4ACF",
                                "ajv-green": "#0f5132",
                                "ajv-moss": "#0a3d26",
                                "ajv-mint": "#e7f5ed",
                                "ajv-cream": "#f7f8f5",
                                "ajv-gold": "#c2a85b",
                        },
                },
        },
        plugins: [],
};
