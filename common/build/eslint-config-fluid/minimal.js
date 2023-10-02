/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * "Minimal" eslint configuration.
 *
 * This configuration is primarily intended for use in packages during prototyping / initial setup.
 * Ideally, all of packages in the fluid-framework repository should derive from either the "Recommended" or
 * "Strict" configuration.
 *
 * Production packages **should not** use this configuration.
 */
module.exports = {
	env: {
		browser: true,
		es6: true,
		es2024: false,
		node: true,
	},
	extends: [
		"./base",
		"plugin:eslint-comments/recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"prettier",
	],
	globals: {
		Atomics: "readonly",
		SharedArrayBuffer: "readonly",
	},
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 2018,
		sourceType: "module",
		project: "./tsconfig.json",
	},
	plugins: [
		// Plugin documentation: https://www.npmjs.com/package/@rushstack/eslint-plugin
		"@rushstack/eslint-plugin",
		// Plugin documentation: https://www.npmjs.com/package/@rushstack/eslint-plugin-security
		"@rushstack/eslint-plugin-security",
		// Plugin documentation: https://www.npmjs.com/package/@typescript-eslint/eslint-plugin
		"@typescript-eslint/eslint-plugin",
		// Plugin documentation: https://www.npmjs.com/package/eslint-plugin-jsdoc
		"eslint-plugin-jsdoc",
		// Plugin documentation: https://www.npmjs.com/package/eslint-plugin-promise
		"eslint-plugin-promise",
		// Plugin documentation: https://www.npmjs.com/package/eslint-plugin-tsdoc
		"eslint-plugin-tsdoc",
		// Plugin documentation: https://www.npmjs.com/package/eslint-plugin-unused-imports
		"unused-imports",
		// Plugin documentation: https://www.npmjs.com/package/eslint-plugin-unicorn
		"unicorn",
	],
	reportUnusedDisableDirectives: true,
	ignorePatterns: [
		// Don't lint generated packageVersion files.
		"**/packageVersion.ts",
	],
	rules: {
		/**
		 * The @rushstack rules are documented in the package README:
		 * {@link https://www.npmjs.com/package/@rushstack/eslint-plugin}
		 */
		"@rushstack/no-new-null": "warn",

		/**
		 * RATIONALE: Harmless.
		 *
		 * Our guideline is to only use leading underscores on private members when required to avoid a conflict
		 * between private fields and a public property.
		 *
		 * Docs: {@link https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md}
		 */
		"@typescript-eslint/naming-convention": [
			"error",
			{
				selector: "accessor",
				modifiers: ["private"],
				format: ["camelCase"],
				leadingUnderscore: "allow",
			},
		],

		/**
		 * Encourages minimal disabling of eslint rules, while still permitting whole-file exclusions.
		 */
		"eslint-comments/disable-enable-pair": [
			"error",
			{
				allowWholeFile: true,
			},
		],

		// ENABLED INTENTIONALLY
		"@typescript-eslint/ban-types": "error",
		"@typescript-eslint/dot-notation": "error",
		"@typescript-eslint/no-non-null-assertion": "error",
		"@typescript-eslint/no-unnecessary-type-assertion": "error",

		"eqeqeq": ["error", "smart"],
		"import/no-deprecated": "error",
		"max-len": [
			"error",
			{
				code: 120,
				ignoreTrailingComments: true,
				ignoreUrls: true,
				ignoreStrings: true,
				ignoreTemplateLiterals: true,
				ignoreRegExpLiterals: true,
			},
		],
		"no-multi-spaces": [
			"error",
			{
				ignoreEOLComments: true,
			},
		],

		/**
		 * Note: this can be replaced altogether by `@typescript-eslint/no-unused-vars`,
		 * but that rule covers many more scenarios than this one does, and there are many violations
		 * currently in the repository, so it has not been enabled yet.
		 */
		"unused-imports/no-unused-imports": "error",

		"valid-typeof": "error",

		/**
		 * Catches a common coding mistake where "resolve" and "reject" are confused.
		 */
		"promise/param-names": "warn",

		"unicorn/better-regex": "error",
		"unicorn/filename-case": [
			"error",
			{
				cases: {
					camelCase: true,
					pascalCase: true,
				},
			},
		],
		"unicorn/no-new-buffer": "error",
		"unicorn/prefer-switch": "error",
		"unicorn/prefer-ternary": "error",
		"unicorn/prefer-type-error": "error",

		// #region DISABLED INTENTIONALLY

		/**
		 * Disabled because we don't require that all variable declarations be explicitly typed.
		 */
		"@rushstack/typedef-var": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/explicit-member-accessibility": "off",

		/**
		 * Disabled because we will lean on the formatter (i.e. prettier) to enforce indentation policy.
		 */
		"@typescript-eslint/indent": "off",
		"@typescript-eslint/member-ordering": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/no-use-before-define": "off",
		"@typescript-eslint/typedef": "off",

		/**
		 * Disabled because we want to encourage documenting different events separately.
		 */
		"@typescript-eslint/unified-signatures": "off",

		// Requires a lot of changes
		"@typescript-eslint/no-duplicate-type-constituents": "off",

		// Lots of false positives
		"@typescript-eslint/non-nullable-type-assertion-style": "off",

		// Requires breaking changes; enabled in the strict config
		"@typescript-eslint/consistent-indexed-object-style": "off",

		// Requires a lot of changes; enabled in the strict config
		"@typescript-eslint/no-unsafe-enum-comparison": "off",

		// Requires a lot of changes; enabled in the strict config
		"@typescript-eslint/no-redundant-type-constituents": "off",

		// Requires a lot of changes; enabled in the strict config
		"@typescript-eslint/consistent-generic-constructors": "off",

		// Off for minimal and recommended; enabled in the strict config
		"@typescript-eslint/consistent-type-exports": "off",
		"@typescript-eslint/consistent-type-imports": "off",

		"func-call-spacing": "off", // Off because it conflicts with typescript-formatter
		"no-empty": "off",
		"no-void": "off",
		"require-atomic-updates": "off",

		/**
		 * Superseded by `@typescript-eslint/dot-notation`.
		 */
		"dot-notation": "off",

		/**
		 * Superseded by `@typescript-eslint/no-unused-expressions`.
		 */
		"no-unused-expressions": "off",

		// #endregion

		// #region FORMATTING RULES

		"@typescript-eslint/brace-style": [
			"error",
			"1tbs",
			{
				allowSingleLine: true,
			},
		],
		"@typescript-eslint/comma-spacing": "error",
		"@typescript-eslint/func-call-spacing": "error",
		"@typescript-eslint/keyword-spacing": "error",
		"@typescript-eslint/member-delimiter-style": [
			"error",
			{
				multiline: {
					delimiter: "semi",
					requireLast: true,
				},
				singleline: {
					delimiter: "semi",
					requireLast: true,
				},
				multilineDetection: "brackets",
			},
		],
		"@typescript-eslint/object-curly-spacing": ["error", "always"],
		"@typescript-eslint/semi": ["error", "always"],
		"@typescript-eslint/space-before-function-paren": [
			"error",
			{
				anonymous: "never",
				asyncArrow: "always",
				named: "never",
			},
		],
		"@typescript-eslint/space-infix-ops": "error",
		"@typescript-eslint/type-annotation-spacing": "error",
		"array-bracket-spacing": "error",
		"arrow-spacing": "error",
		"block-spacing": "error",
		"dot-location": ["error", "property"],
		"jsx-quotes": "error",
		"key-spacing": "error",
		"space-unary-ops": "error",
		"switch-colon-spacing": "error",

		// #endregion

		// #region DOCUMENTATION RULES

		/**
		 * This rule ensures that our Intellisense looks good by verifying the TSDoc syntax.
		 */
		"tsdoc/syntax": "error",

		// #region eslint-plugin-jsdoc rules

		/**
		 * Ensures that conflicting access tags don't exist in the same comment.
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#check-access>.
		 */
		"jsdoc/check-access": "error",

		/**
		 * Ensures consistent line formatting in JSDoc/TSDoc comments
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-rules-check-alignment>
		 *
		 * TODO: This is temporarily set to "warn" because there are a lot of false positives with code blocks in
		 * particular.
		 */
		"jsdoc/check-line-alignment": "warn",

		/**
		 * The syntax this validates does not accommodate the syntax used by API-Extractor
		 * See <https://api-extractor.com/pages/tsdoc/tag_example/>
		 */
		"jsdoc/check-examples": "off",

		/**
		 * Ensures correct indentation within JSDoc/TSDoc comment body
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-rules-check-indentation>
		 */
		"jsdoc/check-indentation": "error",

		/**
		 * Covered by `tsdoc/syntax`
		 */
		"jsdoc/check-tag-names": "off",

		/**
		 * Ensures that JSDoc/TSDoc "modifier" tags are empty.
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-rules-empty-tags>
		 */
		"jsdoc/empty-tags": "error",

		/**
		 * Ensures multi-line formatting meets JSDoc/TSDoc requirements.
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-rules-no-bad-blocks>
		 */
		"jsdoc/no-bad-blocks": "error",

		/**
		 * Requires that each line in a JSDoc/TSDoc comment starts with a `*`.
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-rules-require-asterisk-prefix>
		 */
		"jsdoc/require-asterisk-prefix": "error",

		/**
		 * Ensure function/method parameter comments include a `-` between name and description.
		 * Useful to ensure API-Extractor compatability.
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-rules-require-hyphen-before-param-description>.
		 */
		"jsdoc/require-hyphen-before-param-description": "error",

		/**
		 * Require `@param` tags be non-empty.
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-rules-require-param-description>
		 */
		"jsdoc/require-param-description": "error",

		/**
		 * Requires `@returns` tags to be non-empty.
		 * See <https://github.com/gajus/eslint-plugin-jsdoc#user-content-eslint-plugin-jsdoc-rules-require-returns-description>
		 */
		"jsdoc/require-returns-description": "error",

		// #endregion

		// #endregion

		"@typescript-eslint/prefer-includes": "error",
		"@typescript-eslint/prefer-nullish-coalescing": "error",
		"@typescript-eslint/prefer-optional-chain": "error",

		/**
		 * By default, libraries should not take dependencies on node libraries.
		 * This rule can be disabled at the project level for libraries that are intended to be used only in node.
		 *
		 * @remarks
		 *
		 * Note: "events" has been allow-listed here due to the sheer number of uses across the codebase.
		 * We may wish to address this in the future.
		 */
		"import/no-nodejs-modules": ["error", { allow: ["events"] }],
	},
	overrides: [
		{
			// Rules only for TypeScript files
			files: ["*.ts", "*.tsx"],
			rules: {
				"dot-notation": "off", // Superseded by @typescript-eslint/dot-notation
				"no-unused-expressions": "off", // Superseded by @typescript-eslint/no-unused-expressions
			},
			settings: {
				jsdoc: {
					mode: "typescript",
				},
			},
		},
		{
			// Rules only for React files
			files: ["*.jsx", "*.tsx"],
			plugins: [
				// Plugin documentation: https://www.npmjs.com/package/eslint-plugin-react
				"react",

				// Plugin documentation: https://www.npmjs.com/package/eslint-plugin-react-hooks
				"react-hooks",
			],
			extends: ["plugin:react/recommended", "plugin:react-hooks/recommended"],
			settings: {
				react: {
					version: "detect",
				},
			},
		},
		{
			// Rules only for test files
			files: ["*.spec.ts", "*.test.ts", "**/test/**"],
			rules: {
				"@typescript-eslint/no-invalid-this": "off",
				"@typescript-eslint/unbound-method": "off", // This rule has false positives in many of our test projects.
				"import/no-nodejs-modules": "off", // Node libraries are OK for test files.
				"import/no-deprecated": "off", // Deprecated APIs are OK to use in test files.

				// Disabled for test files
				"@typescript-eslint/consistent-type-exports": "off",
				"@typescript-eslint/consistent-type-imports": "off",
			},
		},
	],
	settings: {
		"import/extensions": [".ts", ".tsx", ".d.ts", ".js", ".jsx"],
		"import/parsers": {
			"@typescript-eslint/parser": [".ts", ".tsx", ".d.ts"],
		},
		"import/resolver": {
			node: {
				extensions: [".ts", ".tsx", ".d.ts", ".js", ".jsx"],
			},
		},
		"jsdoc": {
			// The following are intended to keep js/jsx JSDoc comments in line with TSDoc syntax used in ts/tsx code.
			tagNamePreference: {
				arg: {
					message: "Please use @param instead of @arg.",
					replacement: "param",
				},
				argument: {
					message: "Please use @param instead of @argument.",
					replacement: "param",
				},
				return: {
					message: "Please use @returns instead of @return.",
					replacement: "returns",
				},
			},
		},
	},
};
