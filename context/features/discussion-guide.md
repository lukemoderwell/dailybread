# Discussion Guide

Framework for helping families discuss scripture.

## Structure
```typescript
interface DiscussionGuide {
  bigIdea: string;        // One punchy, memorable statement
  aboutGod: string;       // What this reveals about God
  aboutPeople: string;    // What this reveals about us
  starterQuestion: string; // Opening question for whole family
}
```

## The Framework
Every passage answers two questions:
1. **About God**: His character, nature, actions, heart
2. **About People**: Our nature, our need, how we respond

## Prompt Location
`lib/ai/prompts/question-generation.ts`

## UI Location
`components/reading/reading-experience.tsx` (~line 955)
