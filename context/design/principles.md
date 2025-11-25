# Design Principles

Attio-inspired minimal design.

## Core Rules
- Color sparingly: black, white, gray, single blue accent
- Hierarchy through weight/spacing, not color
- Dark mode is primary
- Mobile-first with 40px+ touch targets

## Component Style
```tsx
// Good - minimal, clean
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Avoid - too colorful
<Card className="bg-gradient-to-r from-purple-500 to-pink-500">
```

## Typography
- Use `font-semibold` for emphasis, not color
- Muted text: `text-muted-foreground`
- Section headers: uppercase, tracking-wide, small
