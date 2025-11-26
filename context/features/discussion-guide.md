# Discussion Guide

Framework for helping families discuss scripture.

## Structure
```typescript
interface DiscussionGuide {
  bigIdea: string;        // One punchy, memorable statement
  aboutGod: string;       // What this reveals about God
  aboutPeople: string;    // What this reveals about us
  starterQuestion: string; // Primer question shown before reading
}
```

## The Framework
Every passage answers two questions:
1. **About God**: His character, nature, actions, heart
2. **About People**: Our nature, our need, how we respond

## Prompt Location
`lib/ai/prompts/question-generation.ts`

## UI Location
- **Primer Question**: Scripture tab (~line 814) - labeled "Before You Read"
- **Discussion Guide**: Questions tab (~line 1005) - shows Big Idea, About God, About People
