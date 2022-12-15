module.exports = {
    "stories": [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    "addons": [
        "@storybook/addon-links",
        // "@storybook/addon-essentials",
        "@storybook/addon-actions",
        "@storybook/addon-interactions",
        "@storybook/jest",
        "@storybook/testing-library",
        "storybook-dark-mode",
        "storybook-addon-angular-router"
    ],
    "framework": "@storybook/angular",
    "core": {
        "builder": "@storybook/builder-webpack5"
    }
}
