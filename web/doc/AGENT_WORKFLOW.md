# Agent Workflow & Development Protocol

## 🎯 Purpose
This document defines the standard workflow for developers and AI agents working on the Quantum Chess AI Battleground project. Following this workflow ensures consistency, quality, and proper tracking of all development activities.

**Project**: Quantum Chess AI Battleground  
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Vercel  
**Focus**: AI model competition platform with LLM reasoning transparency

## 📋 MANDATORY WORKFLOW - READ FIRST

### Before Starting ANY Task:

1. **READ THIS DOCUMENT COMPLETELY**
2. **CHECK PROJECT_TASKS.md** for current sprint and priorities
3. **REVIEW TECHNICAL_CHECKLIST.md** for implementation standards
4. **REVIEW STYLE_GUIDE.md** for code style standards
5. **REVIEW UI_STYLE_GUIDE.md** for visual design standards
6. **USE PLAN MODE** before making any changes
7. **UPDATE TASK STATUS** in tracking documents

## 🔄 Standard Development Workflow

### Step 1: Context Gathering (ALWAYS DO FIRST)
```bash
# 1. Check current branch and status
git status
git branch

# 2. Read key documents
cat web/doc/AGENT_WORKFLOW.md      # This file - workflow rules
cat web/doc/PROJECT_TASKS.md       # Current tasks and priorities
cat web/doc/TECHNICAL_CHECKLIST.md # Technical requirements
cat web/doc/STYLE_GUIDE.md         # Code style standards
cat web/doc/UI_STYLE_GUIDE.md      # UI/visual design standards
cat web/docs/PRD_QUANTUM_CHESS_BATTLEGROUND.md # Product requirements

# 3. Check current implementation status
ls -la app/           # Next.js app structure
ls -la lib/models/    # AI model implementations
ls -la components/    # React components
```

### Step 2: Task Selection & Planning

#### A. Identify Task
1. Open `PROJECT_TASKS.md`
2. Find next available task marked as `⬜ Not Started` with highest priority
3. Check task dependencies are completed
4. Assign task to yourself by changing status to `🔄 In Progress`

#### B. Enter Plan Mode
```markdown
ALWAYS use plan mode before implementation:
1. State: "I'm going to work on [TASK_ID]: [TASK_NAME]"
2. Create detailed plan with:
   - Files to be created/modified
   - Key functions/components to implement
   - Test cases to write
   - Integration points
3. Get plan approval before proceeding
```

#### C. Create Task Branch
```bash
# Format: feature/[phase]-[task-id]-[brief-description]
git checkout -b feature/phase1-t1.1-nextjs-setup
```

### Step 3: Implementation Protocol

#### A. File Creation Order
1. **Types/Interfaces** first (`types/*.ts`)
2. **Utilities/Helpers** (`lib/utils/*.ts`)
3. **Core Logic** (`lib/[feature]/*.ts`)
4. **API Routes** (`app/api/*/route.ts`)
5. **Components** (`components/*.tsx`)
6. **Pages** (`app/*/page.tsx`)
7. **Tests** (`__tests__/*.test.ts`)

#### B. Code Standards (See STYLE_GUIDE.md for complete code standards)
```typescript
// EVERY file must have:
// 1. Header comment with purpose
// 2. Type definitions (no 'any' types)
// 3. Error handling with custom error classes
// 4. Loading states for async operations
// 5. Proper logging with context
// 6. UI components following UI_STYLE_GUIDE.md

/**
 * @file [filename]
 * @purpose [Brief description]
 * @author AI Agent
 * @date [Current date]
 * @task [TASK_ID from PROJECT_TASKS.md]
 */

// Follow conventions from both style guides:
// Code: STYLE_GUIDE.md
// - PascalCase: Components, Types, Classes
// - camelCase: functions, variables
// - SCREAMING_SNAKE_CASE: constants
// UI: UI_STYLE_GUIDE.md
// - Dark theme with quantum colors
// - 8px spacing grid
// - Smooth animations (300ms)

import { type Config } from '@/types';

export async function functionName(
  param: ParamType
): Promise<ReturnType> {
  try {
    // Implementation following style guide
  } catch (error) {
    console.error(`[TASK_ID] Error in functionName:`, error);
    throw new Error(`Failed to execute functionName: ${error.message}`);
  }
}
```

#### C. Testing Requirements
- Unit tests for all utilities
- Integration tests for API routes
- Component tests with React Testing Library
- E2E tests for critical user flows

### Step 4: Progress Updates

#### A. During Development
```markdown
# Update task status in PROJECT_TASKS.md
- Change checkbox: ⬜ → 🔄 (in progress)
- Add progress notes:
  - [timestamp] Started implementation
  - [timestamp] Completed component X
  - [timestamp] Writing tests
```

#### B. Commit Messages
```bash
# Format: [PHASE-TASK] type: description
# Types: feat, fix, docs, test, refactor, style, perf

git commit -m "[P1-T1.1] feat: Initialize Next.js 14 project with TypeScript"
git commit -m "[P1-T1.2] feat: Add Tailwind CSS configuration"
git commit -m "[P2-T2.3] test: Add unit tests for BaseModel interface"
```

### Step 5: Review & Completion

#### A. Self-Review Checklist (Must pass before PR)
- [ ] Code follows STYLE_GUIDE.md conventions
- [ ] UI follows UI_STYLE_GUIDE.md design system
- [ ] TypeScript compiles without errors (no 'any' types)
- [ ] All tests passing (80% coverage minimum)
- [ ] No console.log statements in code
- [ ] Documentation and comments updated
- [ ] Task requirements from PROJECT_TASKS.md met
- [ ] Performance benchmarks met (see TECHNICAL_CHECKLIST.md)
- [ ] Security best practices followed
- [ ] Accessibility standards met (WCAG 2.1)
- [ ] Dark mode properly implemented
- [ ] Quantum visualizations working correctly

#### B. Update Documentation
1. Mark task complete in `PROJECT_TASKS.md` (🔄 → ✅)
2. Update `TECHNICAL_CHECKLIST.md` with completed items
3. Add any new dependencies to `package.json`
4. Document any API changes

#### C. Create Pull Request
```markdown
Title: [PHASE-TASK] Brief description

## Summary
Brief description of changes

## Task Reference
- Task ID: [P1-T1.1]
- Task Name: [Initialize Next.js project]
- Phase: [1 - Foundation]

## Changes Made
- List of key changes
- New files created
- Files modified

## Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Followed AGENT_WORKFLOW.md
- [ ] Updated PROJECT_TASKS.md
- [ ] Code reviewed against standards
- [ ] Documentation updated
```

## 🚨 CRITICAL RULES - NEVER SKIP

### 1. Planning is Mandatory
```markdown
NEVER start coding without:
1. Reading this workflow document
2. Checking current task status
3. Using plan mode
4. Getting plan approval
```

### 2. Task Tracking is Required
```markdown
ALWAYS update task status:
- Before starting (⬜ → 🔄)
- When blocked (🔄 → 🚫)
- When complete (🔄 → ✅)
```

### 3. Context Preservation
```markdown
When session ends, ALWAYS:
1. Commit current work
2. Update task status
3. Leave detailed notes about:
   - What was completed
   - What remains
   - Any blockers
   - Next steps
```

### 4. Dependencies First
```markdown
NEVER work on a task if:
- Its dependencies aren't complete
- Higher priority tasks exist
- It's blocked by another task
```

## 📁 Project Structure Reference

```
quantum-chess-battleground/
├── web/
│   ├── doc/                    # 📍 Project management docs
│   │   ├── AGENT_WORKFLOW.md      # This file - ALWAYS READ FIRST
│   │   ├── PROJECT_TASKS.md       # Task tracking - CHECK SECOND
│   │   ├── TECHNICAL_CHECKLIST.md # Technical specs - REFERENCE
│   │   ├── STYLE_GUIDE.md         # Code style standards - FOLLOW
│   │   ├── UI_STYLE_GUIDE.md      # UI design standards - FOLLOW
│   │   └── DOCUMENTATION_GUIDE.md # Documentation standards - REFERENCE
│   └── docs/                   # Technical documentation
│       └── PRD_QUANTUM_CHESS_BATTLEGROUND.md # Product requirements
├── app/                        # Next.js app directory
│   ├── api/                   # API routes (serverless)
│   ├── game/[id]/             # Game viewer pages
│   ├── tournament/            # Tournament pages
│   └── analytics/             # Analytics dashboard
├── components/                # React components
│   ├── board/                # Chess board components
│   ├── reasoning/            # AI reasoning display
│   └── tournament/           # Tournament UI
├── lib/                      # Core logic
│   ├── game-engine/         # Chess engine
│   ├── models/              # AI models
│   │   ├── base/           # Base interfaces
│   │   ├── baseline/       # Minimax baseline
│   │   └── llm/           # LLM models
│   └── utils/              # Utilities
├── public/                  # Static assets
├── types/                   # TypeScript types
└── __tests__/              # Test files
```

## 🔍 Quick Reference Commands

### Check Project Status
```bash
# See current tasks
grep -n "🔄 In Progress" web/doc/PROJECT_TASKS.md

# Find incomplete tasks
grep -n "⬜ Not Started" web/doc/PROJECT_TASKS.md | head -5

# Check blocked tasks
grep -n "🚫 Blocked" web/doc/PROJECT_TASKS.md

# View project phase
grep -A 5 "Current Status" web/doc/PROJECT_TASKS.md
```

### Start New Task
```bash
# 1. Find next task
cat web/doc/PROJECT_TASKS.md | grep -A 5 "⬜ Not Started" | head -20

# 2. Create branch
git checkout -b feature/[phase]-[task]-[description]

# 3. Update task status (manually edit PROJECT_TASKS.md)
# Change: ⬜ Not Started → 🔄 In Progress

# 4. Start plan mode
echo "Enter plan mode and describe implementation approach"
```

### Complete Task
```bash
# 1. Run tests
npm test

# 2. Update documentation
# Edit PROJECT_TASKS.md: 🔄 → ✅

# 3. Commit with proper message
git add .
git commit -m "[P1-T1.1] feat: Complete task description"

# 4. Push branch
git push origin feature/[branch-name]
```

## 🎓 Learning Resources

### For New Agents/Developers
1. **First Session**: Read all files in `web/doc/`
2. **Before Each Task**: Review this workflow
3. **During Development**: Keep PROJECT_TASKS.md open
4. **After Each Session**: Update all tracking documents

### Key Principles
- **Plan Before Doing**: Always use plan mode
- **Track Everything**: Update status immediately
- **Test Continuously**: Write tests as you code
- **Document Changes**: Keep docs in sync
- **Communicate Status**: Clear commit messages

## 🆘 When Stuck

### If Blocked:
1. Update task status to 🚫 Blocked
2. Document the blocker in PROJECT_TASKS.md
3. Find alternative task to work on
4. Create GitHub issue if needed

### If Confused:
1. Re-read this workflow document
2. Check PRD for product context
3. Review similar completed tasks
4. Look at existing code examples

### If Breaking Changes Needed:
1. Stop immediately
2. Document proposed changes
3. Use plan mode to explain impact
4. Get approval before proceeding

## ✅ Success Criteria

You're following the workflow correctly if:
- Every coding session starts with reading this document
- You always check PROJECT_TASKS.md before starting work
- You review STYLE_GUIDE.md and follow all code conventions
- You review UI_STYLE_GUIDE.md and follow all design standards
- You use plan mode before making changes
- Task statuses are always current
- Your commits reference task IDs and follow format guidelines
- Tests are written alongside code (80% coverage minimum)
- Documentation stays updated
- Code passes all style guide checks
- UI components match the design system
- TypeScript has no errors and no 'any' types

## 🔄 Workflow Version

- **Version**: 1.0.0
- **Last Updated**: 2024-12-XX
- **Next Review**: After Phase 1 completion

---

**REMEMBER**: This workflow is MANDATORY. Skipping steps leads to confusion, wasted effort, and poor code quality. When in doubt, re-read this document and follow it step by step.