module.exports = {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        './node_modules/preline/**/*.js',
    ],
    purge: [],
    darkMode: 'class', // or 'media' or 'class'
    theme: {
        extend: {
        }
    },
    variants: {
        extend: {},
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}