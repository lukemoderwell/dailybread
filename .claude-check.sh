#!/bin/bash
# Auto-check script for Claude Code hooks

cd /Users/henrik-iii/dev/daily-bread

echo "🔍 Running type check..."
TYPE_OUTPUT=$(npx tsc --noEmit 2>&1 | grep -v ".next/types")

if [ -z "$TYPE_OUTPUT" ]; then
  echo "✅ Type check passed"
else
  echo "❌ Type errors found:"
  echo "$TYPE_OUTPUT" | head -10
  exit 1
fi

echo ""
echo "🔍 Running ESLint..."
LINT_OUTPUT=$(npx eslint . --ext .ts,.tsx --quiet 2>&1 | head -20)

if [ -z "$LINT_OUTPUT" ]; then
  echo "✅ Lint check passed"
else
  echo "⚠️  Lint warnings/errors:"
  echo "$LINT_OUTPUT"
fi

echo ""
echo "✨ All checks complete!"
