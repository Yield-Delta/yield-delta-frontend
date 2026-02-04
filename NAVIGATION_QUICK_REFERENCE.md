# Navigation Component - Quick Reference Guide

## File Location
`/workspaces/yield-delta-protocol/yield-delta-frontend/src/components/Navigation.tsx`

## Component Props

```typescript
interface NavigationProps {
  variant?: 'light' | 'dark' | 'transparent';  // Default: 'transparent'
  className?: string;                           // Additional CSS classes
  showWallet?: boolean;                         // Default: true
  showLaunchApp?: boolean;                      // Default: true
}
```

## Usage Examples

### Basic Usage (Landing Page)
```tsx
import { Navigation } from '@/components/Navigation';

export default function HomePage() {
  return (
    <>
      <Navigation />  {/* Uses all defaults */}
      {/* Page content */}
    </>
  );
}
```

### App Navigation (Inside App)
```tsx
import { Navigation } from '@/components/Navigation';

export default function VaultsPage() {
  return (
    <>
      <Navigation
        variant="dark"
        showLaunchApp={false}  // Hides "Launch App" button, shows nav links
      />
      {/* Page content */}
    </>
  );
}
```

### Custom Styling
```tsx
<Navigation
  variant="light"
  className="custom-nav-class"
  showWallet={false}  // Hides wallet button
/>
```

## Key Features

### Performance
- ✅ Memoized callbacks (useCallback)
- ✅ Memoized components (React.memo)
- ✅ will-change optimization
- ✅ Proper cleanup on unmount
- ✅ 60 FPS animations

### Accessibility
- ✅ Full keyboard navigation (Tab, Escape)
- ✅ Focus trap in mobile menu
- ✅ ARIA attributes
- ✅ Screen reader support
- ✅ WCAG 2.1 AA compliant

### Animation Timings
- Opening: ~1.5s total
- Closing: ~0.6s total
- Smooth 60 FPS throughout

## Mobile Menu Links

The mobile menu includes these navigation items:
1. Vaults
2. Market
3. Sentiment
4. Portfolio
5. Rebalance
6. Docs
7. Deploy (CTA button)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate to next focusable element |
| Shift + Tab | Navigate to previous focusable element |
| Escape | Close mobile menu |
| Enter | Activate focused element |
| Space | Activate focused element |

## GSAP Animations

### Logo Animation
- Continuous breathing effect (3s loop)
- Hover enhancement (0.3s)
- Drop shadow glow effect

### Mobile Menu Opening
1. Backdrop fade + scale (0.6s)
2. Orbs elastic spring (1.2s with stagger)
3. Header blur removal (0.8s)
4. Menu items stagger (0.7s)
5. Footer delayed (0.8s)

### Mobile Menu Closing
1. Footer fade out (0.3s)
2. Menu items reverse stagger (0.4s)
3. Header fade out (0.3s)
4. Backdrop fade out (0.4s)
5. Container final fade (0.2s)

## Z-Index Layering

```
Navigation Bar:      z-index: 99999
Mobile Menu Overlay: z-index: 99999
Close Button:        z-index: 10 (relative to menu)
Menu Content:        z-index: 10 (relative to menu)
```

## CSS Classes Reference

### Navigation Container
- `.simple-nav-container` - Main flex container
- `.nav-left-simple` - Left section (logo)
- `.nav-center-links` - Center navigation links
- `.nav-right-simple` - Right section (wallet, hamburger)

### Mobile Menu
- `.mobile-menu-backdrop` - Full-screen backdrop
- `.mobile-menu-header` - Menu header section
- `.mobile-menu-item` - Individual menu items
- `.mobile-menu-footer` - Footer section with CTA
- `.mobile-menu-orb` - Floating gradient orbs

### Buttons
- `.mobile-menu-btn` - Hamburger menu button
- `.btn-cyber` - Launch App button

## Styling Customization

### Change Menu Background
Edit in `Navigation.tsx` line ~544:
```typescript
background: 'linear-gradient(180deg, rgba(10, 10, 18, 0.97) 0%, ...)'
```

### Adjust Animation Speed
Edit timeline durations in `Navigation.tsx` lines ~184-239

### Modify Colors
Update gradient colors in:
- Menu items (line ~57)
- Header title (line ~659)
- Deploy CTA (line ~696)

## Common Issues & Solutions

### Issue: Menu doesn't close on navigation
**Solution**: `closeMobileMenu()` is called on every Link's `onClick`

### Issue: Body scroll not working after menu close
**Solution**: Cleanup function restores `document.body.style.overflow = ''`

### Issue: Focus not returning to hamburger
**Solution**: `hamburgerButtonRef.current?.focus()` in close handler

### Issue: Animations choppy on low-end devices
**Solution**: will-change is properly managed, check if browser supports backdrop-filter

### Issue: Keyboard navigation not working
**Solution**: Verify focus trap useEffect is running, check console for errors

## Performance Monitoring

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Performance tab
3. Record while opening/closing menu
4. Check for 60 FPS in timeline
5. Verify no memory leaks in heap snapshots

### Accessibility Audit
1. Use Lighthouse (DevTools > Lighthouse)
2. Run accessibility audit
3. Check for ARIA issues
4. Verify keyboard navigation
5. Test with screen reader

## Dependencies

```json
{
  "react": "^18.0.0",
  "next": "^14.0.0",
  "gsap": "^3.12.0",
  "lucide-react": "latest"
}
```

## Related Files

- `src/styles/navigation.css` - Navigation-specific styles
- `src/styles/animations.css` - Animation keyframes
- `src/components/Logo.tsx` - Logo component
- `src/components/WalletConnectButton.tsx` - Wallet connection

## Support & Documentation

- Full documentation: `Navigation.IMPROVEMENTS.md`
- Implementation summary: `/NAVIGATION_IMPLEMENTATION_SUMMARY.md`
- Code examples: See usage section above

## Quick Checklist for New Developers

- [ ] Understand component props and variants
- [ ] Review GSAP animation sequences
- [ ] Test keyboard navigation (Tab, Escape)
- [ ] Verify mobile menu on different screen sizes
- [ ] Check accessibility with screen reader
- [ ] Monitor performance with DevTools
- [ ] Review focus management flow
- [ ] Test body scroll locking behavior

## Contact

For questions or issues with the Navigation component:
1. Check this quick reference
2. Review detailed documentation in `Navigation.IMPROVEMENTS.md`
3. Check console for errors
4. Contact the frontend team

---

**Last Updated**: December 3, 2025
**Component Version**: 2.0.0
