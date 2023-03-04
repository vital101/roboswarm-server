module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
    "rules": {
        "@typescript-eslint/indent": "error",
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": [
            "error",
            "double",
            {
                "avoidEscape": true
            }
        ],
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/type-annotation-spacing": "error",
        "brace-style": [
            "error",
            "1tbs"
        ],
        "no-trailing-spaces": "error",
        "no-var": "error",
        "prefer-const": "error",
        "spaced-comment": [
            "error",
            "always",
            {
                "markers": [
                    "/"
                ]
            }
        ],
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "whitespace": [
                        true,
                        "check-branch",
                        "check-decl",
                        "check-operator",
                        "check-module",
                        "check-separator",
                        "check-type"
                    ]
                }
            }
        ]
    }
};
