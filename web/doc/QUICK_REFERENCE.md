# Quick Reference Card - Quantum Chess Battleground

## 🚀 Start Working Checklist
```bash
# 1. Get latest code
git pull origin main

# 2. Read current status
cat web/doc/PROJECT_TASKS.md | grep "Current Status" -A 5

# 3. Find your task
grep "⬜ Not Started" web/doc/PROJECT_TASKS.md | head -5

# 4. Create branch
git checkout -b feature/P1-T1.1-description

# 5. Start coding (follow style guide!)
```

## 📝 Naming Conventions
```typescript
// Components & Types
ComponentName    // PascalCase
InterfaceName   // PascalCase
TypeName        // PascalCase

// Functions & Variables
functionName()   // camelCase
variableName    // camelCase
isLoading       // boolean prefix

// Constants
MAX_RETRIES     // SCREAMING_SNAKE_CASE
API_ENDPOINTS   // SCREAMING_SNAKE_CASE

// Files
Component.tsx              // PascalCase components
utilityFunction.ts        // camelCase utilities
game.types.ts             // types files
Component.test.tsx        // test files
```

## 🎯 TypeScript Rules
```typescript
// ❌ NEVER use 'any'
const data: any = fetch();  // BAD

// ✅ Use proper types
const data: GameState = fetch();  // GOOD
const data: unknown = fetch();    // OK if truly unknown

// ✅ Explicit return types
function getMove(): Move { }      // GOOD
function getMove() { }            // BAD
```

## 🧪 Testing Requirements
- **Coverage**: 80% minimum
- **Pattern**: Describe > It
- **Structure**: AAA (Arrange, Act, Assert)
- **Run**: `npm test` before commit

## 📦 Commit Format
```bash
[P1-T1.1] feat: Add game creation endpoint
[P2-T2.3] fix: Resolve quantum state bug
[P3-T3.1] test: Add board component tests
[P1-T1.7] docs: Update API documentation
```

## 🔍 Code Review Checklist
Before PR:
- [ ] No TypeScript errors
- [ ] No 'any' types
- [ ] No console.log
- [ ] Tests passing (80%+)
- [ ] Follows style guide
- [ ] Task complete in PROJECT_TASKS.md

## 📁 Project Structure
```
web/
├── doc/                 # Read these first!
│   ├── AGENT_WORKFLOW.md
│   ├── PROJECT_TASKS.md
│   ├── STYLE_GUIDE.md
│   └── TECHNICAL_CHECKLIST.md
app/                    # Next.js pages
├── api/               # API routes
├── game/             # Game pages
└── tournament/       # Tournament pages
components/            # React components
lib/
├── game-engine/      # Chess logic
├── models/          # AI models
└── utils/          # Helpers
```

## 🚨 Common Mistakes to Avoid
1. **Using `any` type** → Use proper types
2. **No error handling** → Always try/catch
3. **console.log in code** → Use proper logging
4. **No tests** → Write tests first
5. **Wrong commit format** → [TASK] type: desc
6. **Not reading style guide** → Review before coding
7. **Skipping plan mode** → Always plan first

## 🎨 Tailwind Class Order
```tsx
<div className="
  {/* 1. Layout */}     flex items-center
  {/* 2. Spacing */}    p-4 m-2
  {/* 3. Sizing */}     w-full h-64
  {/* 4. Typography */} text-lg font-bold
  {/* 5. Colors */}     bg-white text-gray-900
  {/* 6. Effects */}    rounded-lg shadow-lg
  {/* 7. States */}     hover:shadow-xl
  {/* 8. Animation */}  transition-all duration-200
">
```

## 🔧 Useful Commands
```bash
# Check TypeScript
npm run type-check

# Run tests
npm test
npm run test:coverage

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format

# Build project
npm run build

# Deploy to Vercel
vercel --prod
```

## 📞 When Stuck
1. Read STYLE_GUIDE.md
2. Check similar code in project
3. Review PROJECT_TASKS.md for context
4. Use plan mode to think through
5. Document blockers in task

## 🏁 Definition of Done
- [ ] Feature works as specified
- [ ] TypeScript compiles (no errors)
- [ ] Tests written and passing
- [ ] Style guide followed
- [ ] Documentation updated
- [ ] PR created with proper format
- [ ] Task marked complete ✅

---
**Remember**: Quality > Speed. Follow the guides!