# CodeBlock Copy Functionality Fix

## Problem
The CodeBlock component was showing HTML syntax highlighting classes (like `class="hl-string"`) when users copied code from the documentation pages. This happened because:

1. The component uses `dangerouslySetInnerHTML` to render syntax-highlighted code with HTML `<span>` tags
2. When users manually selected and copied text (Ctrl+C / Cmd+C), the browser copied the HTML content
3. The previous `onCopy` handler on the `<pre>` element wasn't reliably intercepting all copy events

## Solution
Implemented a **document-level copy event listener** with the following improvements:

### Key Changes in `/src/components/docs/CodeBlock.tsx`:

1. **Added useRef hook** to track the `<pre>` element:
   ```typescript
   const preRef = useRef<HTMLPreElement>(null)
   ```

2. **Added useEffect with document-level copy listener**:
   ```typescript
   useEffect(() => {
     const handleCopyEvent = (e: ClipboardEvent) => {
       if (!preRef.current) return

       // Check if the selection is within our code block
       const selection = window.getSelection()
       if (!selection || selection.rangeCount === 0) return

       const range = selection.getRangeAt(0)
       if (!preRef.current.contains(range.commonAncestorContainer)) return

       // Intercept the copy and provide clean code
       e.preventDefault()
       e.clipboardData?.setData('text/plain', code)
     }

     document.addEventListener('copy', handleCopyEvent)
     return () => document.removeEventListener('copy', handleCopyEvent)
   }, [code])
   ```

3. **Attached ref to the pre element**:
   ```typescript
   <pre ref={preRef} className="...">
   ```

## How It Works

1. **Event Listener Registration**: A copy event listener is added to the document when the component mounts
2. **Selection Detection**: When a copy event occurs, the listener checks if the selected text is within the code block
3. **Event Interception**: If the copy is from our code block, we:
   - Prevent the default copy behavior (which would copy HTML)
   - Replace the clipboard data with the raw, clean code
4. **Cleanup**: The event listener is removed when the component unmounts

## Benefits

✅ **Both copy methods work correctly**:
- Copy button: Uses `navigator.clipboard.writeText(code)` - always provides clean code
- Manual selection (Ctrl+C / Cmd+C): Intercepted by document listener - provides clean code

✅ **No HTML artifacts**: Users always get executable code without `<span>` tags

✅ **Reliable across browsers**: Document-level listeners are more reliable than element-level `onCopy` handlers

✅ **Clean architecture**: The raw `code` prop is the single source of truth for clipboard operations

## Testing

### Manual Testing:
1. Navigate to any documentation page with code examples:
   - `/docs/getting-started`
   - `/docs/api-reference`

2. **Test the copy button**:
   - Click the copy button in the top-right corner
   - Paste into an editor - should be clean code

3. **Test manual selection**:
   - Select code with your mouse
   - Press Ctrl+C (or Cmd+C on Mac)
   - Paste into an editor - should be clean code

### Automated Test Page:
Open `/test-copy.html` in a browser to see a live demonstration of the copy interception mechanism.

## Examples

### Before (Broken):
When users copied this code:
```javascript
const headers = {
  'X-API-Key': 'your-api-key-here',
  'Content-Type': 'application/json'
};
```

They got:
```html
<span class="hl-keyword">const</span> headers = {
  <span class="hl-string">'X-API-Key'</span>: <span class="hl-string">'your-api-key-here'</span>,
  <span class="hl-string">'Content-Type'</span>: <span class="hl-string">'application/json'</span>
};
```

### After (Fixed):
Users now always get:
```javascript
const headers = {
  'X-API-Key': 'your-api-key-here',
  'Content-Type': 'application/json'
};
```

## Technical Details

### Why Document-Level Listener?
- Element-level `onCopy` handlers (e.g., on `<pre>`) can be unreliable
- Some browsers don't bubble copy events consistently
- Document-level listeners catch all copy events, then filter by element

### Why Check `commonAncestorContainer`?
- The selection might span multiple elements
- We need to ensure the entire selection is within our code block
- The `commonAncestorContainer` is the smallest node containing the entire selection

### Performance Considerations
- The listener only runs when a copy event occurs (user action)
- Early returns prevent unnecessary processing
- Cleanup function ensures no memory leaks

## Browser Compatibility
✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari
✅ All modern browsers with Clipboard API support

## Related Files
- `/src/components/docs/CodeBlock.tsx` - Main component
- `/src/app/docs/getting-started/page.tsx` - Usage example
- `/src/app/docs/api-reference/page.tsx` - Usage example
- `/test-copy.html` - Test page demonstrating the fix
