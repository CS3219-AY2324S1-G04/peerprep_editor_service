## Tools

- **Runtime environment** : NodeJS 18 LTS (aka NodeJS LTS Hydrogen)
- **Testing Framework** : Jest
- **Documentation Language** : JSDoc
- **Code Formatter** : Prettier
- **Linter** : ESLint

## Conventions

- **File naming convention** : Snake case (e.g. `file_name.ts`)
- **Typescript naming convention** : ESLint's camel case convention described [here](https://typescript-eslint.io/rules/naming-convention/#enforce-the-codebase-follows-eslints-camelcase-conventions)
- **Typescript member ordering** : Refer to [this](https://typescript-eslint.io/rules/member-ordering/#default-configuration)

Refer to `.eslintrc` for more conventions. Alternatively, learn them as you encounter errors and warnings in your code.

## To Do

- Run `npm install` to install all dependencies specified in `package.json`
- Make sure to change the name of the package in `package.json`
- Make sure to change the description of the package in `package.json`
- Delete this `README.md`
- Delete `./src/sum.ts` and `./src/__tests__/sum.test.ts`

## NPM Scripts

The following scripts can be executed via `npm run <script_name>`.

- `start:dev` : Executes the app for development purposes (supports auto refreshing when code changes)
- `start` : Builds and executes the app
- `build` : Builds the app and stores it in the `./build` directory
- `test` : Runs all tests in the `./src` directory
- `format` : Formats all `.ts` files via Prettier
- `lint` : Lints all `.ts` files via ESLint
- `fix` : Formats all `.ts` files via Prettier and also fixes any auto-fixable linting issues

## Developer Dependencies

- **@trivago/prettier-plugin-sort-imports** : Sorts imports
- **@types/jest** : Provides Typescript support for Jest
- **@types/node** : Provides Typescript support for NodeJS modules
- **@typescript-eslint/eslint-plugin** : Provides Typescript ESLint rules
- **@typescript-eslint/parser** : Provides Typescript support for ESLint
- **eslint** : Handles linting
- **eslint-config-prettier** : Prevents ESLint rules from conflicting with Prettier
- **eslint-plugin-prettier** : Enforces Prettier rules via ESLint
- **nodemon** : Restarts running app when code changes are detected
- **prettier** : Handles code formatting
- **rimraf** : Provides "rm -rf" for all platforms (used by build script)
- **ts-jest** : Handles testing
- **ts-node** : Executes Typescript without the need for transpiling
- **typescript** : Provides typescript support

## VSCode Integration

These are only relevant if you're using VSCode.

### Config Files

**`launch.json`**

Add the following to the `.vscode/launch.json` file.

```json
{
  "configurations": [
    {
      "name": "Launch Program",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/nodemon/bin/nodemon.js",
      "internalConsoleOptions": "neverOpen",
      "console": "integratedTerminal"
    }
  ]
}
```

**`settings.json`**

Add the following to the `.vscode/settings.json` file.

```json
{
  "editor.renderWhitespace": "all",
  "editor.rulers": [80],
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.trimTrailingWhitespace": true
}
```

### Recommended Extensions

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) : ESLint support
- [JavaScript and TypeScript Nightly](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) : Javascript/Typescript support
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) : Prettier support

### Optional Extensions

- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) : Spell checking
- [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) : Markdown formatting and other useful features
