# Code Quality & Linting Configuration

## Overview

FoodBuddy project implements comprehensive code quality standards using **ESLint** and **Prettier** to ensure consistent, bug-free, and well-formatted code across the entire codebase.

---

## ✅ ESLint Configuration

### Configuration File

- **Location:** `eslint.config.mjs`
- **Format:** ESLint Flat Config (ESLint v9+)

### Configuration Details

```javascript
// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,      // Core Web Vitals rules
  ...nextTs,          // TypeScript support
  globalIgnores([...]) // Ignore patterns
]);

export default eslintConfig;
```

### Extends

- **`eslint-config-next/core-web-vitals`** - Next.js best practices and Core Web Vitals
- **`eslint-config-next/typescript`** - TypeScript support and type checking

### Rules Coverage

- ✅ **Style Rules** - Code formatting, naming conventions
- ✅ **Bug Detection** - Potential errors, unsafe patterns
- ✅ **Best Practices** - Performance, security, maintainability
- ✅ **TypeScript Rules** - Type safety, explicit typing
- ✅ **React Rules** - Component best practices, hooks usage
- ✅ **Next.js Rules** - Framework-specific optimizations

### Current Status

```
✖ 74 problems (0 errors, 74 warnings)
- 0 ESLint errors
- 74 warnings (mostly unused variables in test files - expected)
```

### Key Disabled Rules With Justification

- **`@typescript-eslint/no-require-imports`** - Required for Node.js scripts (`.js` files)
- **`@next/next/no-assign-module-variable`** - Required for module exports in scripts

---

## 🎨 Prettier Configuration

### Configuration File

- **Location:** `.prettierrc.json`

### Formatting Rules

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Configuration Explanation

| Setting          | Value    | Purpose                                          |
| ---------------- | -------- | ------------------------------------------------ |
| `semi`           | `true`   | Require semicolons at statement ends             |
| `singleQuote`    | `true`   | Use single quotes for strings                    |
| `tabWidth`       | `2`      | Indent with 2 spaces                             |
| `trailingComma`  | `es5`    | Add trailing commas where valid in ES5           |
| `printWidth`     | `100`    | Wrap lines at 100 characters                     |
| `bracketSpacing` | `true`   | Add spaces inside object brackets                |
| `arrowParens`    | `always` | Require parentheses around arrow function params |
| `endOfLine`      | `lf`     | Use Unix line endings                            |

### Ignore File

- **Location:** `.prettierignore`
- **Ignores:** `node_modules/`, `.next/`, `coverage/`, `.env`, `dist/`, etc.

### Current Status

```
✅ All matched files use Prettier code style!
- 83 files formatted
- 100% compliance with Prettier rules
```

---

## 📋 Integration

### ESLint & Prettier Integration

- ✅ **No Conflicts** - ESLint focuses on code quality, Prettier handles formatting
- ✅ **Complementary** - Both tools work together for comprehensive code quality
- ✅ **Consistent** - All developers follow same standards

### CI/CD Integration

- GitHub Actions runs `npm run lint` on every PR
- Blocks merges if ESLint errors are found (warnings are allowed)

---

## 🚀 Scripts

### Available Commands

```bash
# Check code style (ESLint)
npm run lint

# Check code style with detailed output
npm run lint -- --format=detailed

# Format code with Prettier
npm run format

# Check if code matches Prettier style
npm run format:check

# Run both lint and format checks
npm run lint && npm run format:check
```

### Script Details

#### `npm run lint`

- Runs ESLint across entire codebase
- Reports all style violations and potential bugs
- Exits with code 0 if no errors (warnings allowed)
- Exits with code 1 if errors found

#### `npm run format`

- Auto-fixes all Prettier formatting issues
- Modifies files in place
- Safe to run before committing

#### `npm run format:check`

- Checks if files match Prettier style
- Does NOT modify files
- Useful in CI/CD to verify formatting

---

## 📊 Code Quality Metrics

### Current Metrics

- **ESLint Status:** ✅ 0 errors, 74 warnings
- **Prettier Status:** ✅ 100% compliance
- **Test Coverage:** ✅ 80% (Jest + Playwright)
- **TypeScript:** ✅ Strict mode enabled

### Quality Goals

- ✅ Zero ESLint errors (warnings in test files acceptable)
- ✅ 100% Prettier compliance
- ✅ ≥80% test coverage
- ✅ Zero security vulnerabilities

---

## 🔧 Development Workflow

### Pre-Commit (Recommended)

1. Run `npm run lint` - Check for errors
2. Run `npm run format` - Auto-format code
3. Run tests - Verify functionality
4. Commit changes

### CI/CD Pipeline

1. Checkout code
2. Install dependencies
3. Run `npm run lint` - Fail on errors
4. Run `npm run format:check` - Fail if not formatted
5. Run tests
6. Deploy if all checks pass

---

## 📚 References

- **ESLint Docs:** https://eslint.org
- **Prettier Docs:** https://prettier.io
- **ESLint Config Next:** https://github.com/vercel/next.js/tree/canary/packages/eslint-config-next
- **TypeScript ESLint:** https://typescript-eslint.io

---

## ✨ Best Practices

### For Developers

1. **Before Committing:**

   ```bash
   npm run format   # Auto-fix formatting
   npm run lint     # Check for errors
   npm run test     # Verify tests pass
   ```

2. **IDE Integration:**
   - Install ESLint and Prettier extensions
   - Enable "Format on Save" in VS Code
   - Enable "Lint on Save" for real-time feedback

3. **Common Issues:**
   - **Line too long:** Break lines ≤100 chars
   - **Missing semicolon:** Use `npm run format` to auto-fix
   - **Unused variables:** Remove or prefix with `_`

### For CI/CD

1. **Fail Fast:** Lint check before tests
2. **Clear Messages:** Show detailed error context
3. **Auto-Fix:** Consider auto-formatting in pre-commit hook

---

## 🎯 Enforcement

### Mandatory Checks

- ✅ ESLint (errors block merge)
- ✅ Prettier formatting (should match on pull requests)

### Optional Improvements

- Pre-commit hooks (husky + lint-staged)
- VS Code workspace settings
- Team linting documentation

---

Generated: November 9, 2025
FoodBuddy Project
