# Family Members

Each family has members with personalized questions.

## Data Structure
```typescript
interface FamilyMember {
  id: string;
  name: string;
  age: number;
  color: string;      // For UI identification
  notes?: string;     // Parent notes for personalization
}
```

## Question Generation
- One question per family member
- Age-appropriate complexity
- Notes guide topic selection (invisibly, ~70% of time)
- Each question includes an application action

## Age Guidelines (from prompt)
- 2-3: Very simple, concrete, 5-7 words
- 4-5: Simple "why" questions
- 6-8: "What would YOU do?" imagination
- 9-12: Motivations, consequences, principles
- 13+: Theology, ethics, worldview
