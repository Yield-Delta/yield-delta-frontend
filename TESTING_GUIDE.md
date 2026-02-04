# CodeBlock Component - Testing Guide

## Quick Test Instructions

### 1. Start the Development Server

```bash
cd /workspaces/yield-delta-protocol/yield-delta-frontend
npm run dev
```

The server will start at http://localhost:3000

### 2. Test Pages to Visit

#### A. Dedicated Test Page
**URL**: http://localhost:3000/test-codeblock

This page contains:
- Multiple code examples in different languages
- Line-numbered and non-line-numbered examples
- A validation checklist

**What to Check**:
- ✓ No HTML tags visible (like `class="hl-string">`)
- ✓ No HTML entities visible (like `&#039;` or `&quot;`)
- ✓ Strings appear in green color
- ✓ Keywords appear in purple color
- ✓ Numbers appear in orange color
- ✓ Functions appear in blue color
- ✓ Clean, professional appearance

#### B. Documentation Pages

Test the actual documentation pages to ensure they work correctly:

1. **API Reference**: http://localhost:3000/docs/api-reference
   - Contains JavaScript code examples
   - Tests POST requests, fetch calls, etc.

2. **Smart Contracts**: http://localhost:3000/docs/smart-contracts
   - Contains Solidity code examples
   - Tests contract syntax highlighting

3. **Getting Started**: http://localhost:3000/docs/getting-started
   - Contains installation commands (Bash)
   - Tests various code snippets

### 3. Static HTML Test (Optional)

Open the static HTML file directly in your browser:

```bash
# Linux/Mac
open /workspaces/yield-delta-protocol/yield-delta-frontend/test-codeblock-fix.html

# Or navigate to it in your browser:
file:///workspaces/yield-delta-protocol/yield-delta-frontend/test-codeblock-fix.html
```

This shows the expected rendering without any React dependencies.

## Visual Checklist

When reviewing any code block, verify:

### ❌ WRONG (Before Fix)
```
console.log(class="hl-string">&#039;Created vault:&#039;
```
- HTML tags are visible
- HTML entities like `&#039;` are shown as text
- Looks broken and unprofessional

### ✅ CORRECT (After Fix)
```javascript
console.log('Created vault:', data.address)
```
- Clean, readable code
- Proper syntax highlighting colors
- No HTML artifacts visible
- Professional appearance

## Testing Copy Functionality

1. Visit any test page
2. Select some code from a CodeBlock
3. Copy it (Ctrl+C / Cmd+C)
4. Paste into a text editor
5. **Verify**: The pasted code should be clean JavaScript/Bash/etc. without any HTML tags or styling

## Expected Syntax Highlighting Colors

| Element | Color | Hex |
|---------|-------|-----|
| Comments | Gray (italic) | #6b7280 |
| Strings | Green | #34d399 |
| Keywords | Purple | #a78bfa |
| Numbers | Orange | #fb923c |
| Functions | Blue | #60a5fa |
| Properties | Cyan | #22d3ee |
| Methods | Pink | #f472b6 |
| Types | Yellow | #fbbf24 |
| Brackets | Slate | #94a3b8 |
| Variables | Cyan | #22d3ee |

## Language-Specific Tests

### JavaScript/TypeScript
Should correctly highlight:
- `const`, `let`, `var`, `function`, `async`, `await`
- String literals with `'`, `"`, and `` ` ``
- Function calls like `fetch()`, `console.log()`
- Object properties like `.address`, `.json()`
- Template literals like `` `Hello ${name}` ``

### Bash
Should correctly highlight:
- Commands like `npm`, `git`, `echo`, `curl`
- Flags like `--save`, `-m`
- Strings with single and double quotes
- Variables like `$VAR`

### JSON
Should correctly highlight:
- Property names in blue
- String values in green
- Numbers in orange
- Booleans/null in purple
- Brackets in gray

### Solidity
Should correctly highlight:
- Keywords like `contract`, `function`, `public`, `view`
- Types like `uint256`, `address`, `bool`
- Function definitions
- Contract addresses

## Troubleshooting

### If you see HTML entities:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Restart the dev server

### If syntax highlighting doesn't work:
- Check browser console for errors
- Verify the dev server is running
- Check that the language prop is correct (e.g., `language="javascript"`)

### If line numbers don't show:
- Verify `showLineNumbers={true}` is set
- Check that the component is receiving the prop

## Performance Testing

For large code blocks (100+ lines):
1. Test scrolling performance
2. Test copy functionality
3. Verify no lag when highlighting

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (if applicable)

## Success Criteria

The fix is successful if:
1. ✅ All code blocks render clean text
2. ✅ No HTML tags or entities are visible
3. ✅ Syntax highlighting colors are applied correctly
4. ✅ Copy functionality provides clean code
5. ✅ Line numbers work properly
6. ✅ All supported languages work correctly
7. ✅ No TypeScript or ESLint errors
8. ✅ No runtime errors in browser console

## Reporting Issues

If you find any issues:
1. Note the specific page/URL
2. Screenshot the problem
3. Note which language/code snippet
4. Check browser console for errors
5. Document expected vs actual behavior
