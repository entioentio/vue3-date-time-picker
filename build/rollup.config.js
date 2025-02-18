// rollup.config.js
import fs from 'fs';
import vue from 'rollup-plugin-vue';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import PostCSS from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import minimist from 'minimist';

// Get browserslist config and remove ie from es build targets
const esbrowserslist = fs
    .readFileSync('./.browserslistrc')
    .toString()
    .split('\n')
    .filter((entry) => entry && entry.substring(0, 2) !== 'ie');

// Extract babel preset-env config, to combine with esbrowserslist
const babelPresetEnvConfig = {};

const argv = minimist(process.argv.slice(2));

const baseConfig = {
    input: 'src/entry.ts',
    plugins: {
        replace: {
            'process.env.NODE_ENV': JSON.stringify('production'),
            preventAssignment: true,
        },
        vue: {},
        postVue: [
            resolve({
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
            }),
            // Process only `<style module>` blocks.
            PostCSS({
                modules: {
                    generateScopedName: '[local]___[hash:base64:5]',
                },
                include: /&module=.*\.css$/,
            }),
            // Process all `<style>` blocks except `<style module>`.
            PostCSS({ include: /(?<!&module=.*)\.css$/ }),
            commonjs(),
        ],
        babel: {
            exclude: 'node_modules/**',
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
            babelHelpers: 'bundled',
        },
    },
};

const external = ['vue'];

const globals = {
    vue: 'Vue',
};

// Customize configs for individual targets
const buildFormats = [];
if (!argv.format || argv.format === 'es') {
    const esConfig = {
        ...baseConfig,
        input: 'src/entry.esm.ts',
        external,
        output: {
            file: 'dist/vue3-date-time-picker.esm.js',
            format: 'esm',
            exports: 'named',
        },
        plugins: [
            replace(baseConfig.plugins.replace),
            // ...baseConfig.plugins.preVue,
            vue(baseConfig.plugins.vue),
            ...baseConfig.plugins.postVue,
            babel({
                ...baseConfig.plugins.babel,
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            ...babelPresetEnvConfig,
                            targets: esbrowserslist,
                        },
                    ],
                ],
            }),
            terser({
                output: {
                    ecma: 5,
                },
            }),
        ],
    };
    buildFormats.push(esConfig);
}

if (!argv.format || argv.format === 'cjs') {
    const umdConfig = {
        ...baseConfig,
        external,
        output: {
            compact: true,
            file: 'dist/vue3-date-time-picker.ssr.js',
            format: 'cjs',
            name: 'Vue3DatePicker',
            exports: 'auto',
            globals,
        },
        plugins: [
            replace(baseConfig.plugins.replace),
            // ...baseConfig.plugins.preVue,
            vue(baseConfig.plugins.vue),
            ...baseConfig.plugins.postVue,
            babel(baseConfig.plugins.babel),
            terser({
                output: {
                    ecma: 5,
                },
            }),
        ],
    };
    buildFormats.push(umdConfig);
}

if (!argv.format || argv.format === 'iife') {
    const unpkgConfig = {
        ...baseConfig,
        external,
        output: {
            compact: true,
            file: 'dist/vue3-date-time-picker.min.js',
            format: 'iife',
            name: 'Vue3DatePicker',
            exports: 'auto',
            globals,
        },
        plugins: [
            replace(baseConfig.plugins.replace),
            // ...baseConfig.plugins.preVue,
            vue(baseConfig.plugins.vue),
            ...baseConfig.plugins.postVue,
            babel(baseConfig.plugins.babel),
            terser({
                output: {
                    ecma: 5,
                },
            }),
        ],
    };
    buildFormats.push(unpkgConfig);
}

// Export config
export default buildFormats;
