# Daily Bread Documentation

This folder contains technical documentation, session notes, and guidelines for the Daily Bread project.

## 📁 Directory Structure

```
docs/
├── README.md                        # This file
├── session-YYYY-MM-DD.md           # Session notes (changes, bugs fixed, decisions)
└── code-quality-improvements.md    # Ongoing code quality guidelines
```

---

## 📄 Document Types

### Session Notes
Files named `session-YYYY-MM-DD.md` document work completed in each coding session:
- Bug fixes
- Feature additions/removals
- Code quality improvements
- Deployment notes
- Testing recommendations

**Latest**: [session-2025-11-11.md](./session-2025-11-11.md)

### Guidelines
- [code-quality-improvements.md](./code-quality-improvements.md) - DHH-inspired code quality standards and refactoring opportunities

---

## 🎯 Quick Reference

### Recent Work
- **2025-11-11**: Fixed streak calculation bug, removed TTS feature, quick code quality wins

### Key Patterns
- Date handling: Use `getLocalDateISO()` from `lib/dates.ts`
- State management: Question before adding useState
- Component size: Keep components focused and under 500 lines
- DRY: Extract repeated code to functions

---

## 📝 Adding Documentation

When documenting new work:

1. **Create session notes** for significant changes:
   ```bash
   touch docs/session-$(date +%Y-%m-%d).md
   ```

2. **Include**:
   - What was changed
   - Why it was changed
   - How to test
   - Deployment steps
   - Future considerations

3. **Keep it organized**:
   - Use clear headings
   - Link to relevant files with line numbers
   - Add code examples for complex changes
   - Document decisions and trade-offs

---

## 🔗 Related Documentation

- Main README: [../README.md](../README.md)
- Claude Code Usage: [../CLAUDE.md](../CLAUDE.md)

---

Last updated: 2025-11-11
