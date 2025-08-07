# Quantum Chess Battleground - Style Guide

## 📐 Code Style Standards

### TypeScript/JavaScript

#### Naming Conventions
```typescript
// ✅ PascalCase for types, interfaces, components, and classes
interface GameState { }
type MoveResult = { }
class ChessEngine { }
const BoardComponent: React.FC = () => { }

// ✅ camelCase for variables, functions, methods
const currentPlayer = 'white';
function calculateMove() { }
const handleClick = () => { }

// ✅ SCREAMING_SNAKE_CASE for constants
const MAX_THINKING_TIME = 30000;
const API_ENDPOINTS = {
  GAME_CREATE: '/api/game/create',
  GAME_MOVE: '/api/game/[id]/move'
};

// ✅ Prefix private methods with underscore
class Model {
  private _internalMethod() { }
}

// ✅ Use descriptive names
// ❌ Bad: const d = new Date();
// ✅ Good: const currentDate = new Date();

// ✅ Boolean names should be questions
const isLoading = true;
const hasQuantumState = false;
const canMakeMove = true;
```

#### File Naming
```bash
# ✅ Components: PascalCase
ChessBoard.tsx
ThoughtStream.tsx
GameViewer.tsx

# ✅ Utilities: camelCase
gameHelpers.ts
moveValidation.ts
quantumRules.ts

# ✅ Types: camelCase with .types.ts
game.types.ts
model.types.ts
tournament.types.ts

# ✅ Tests: same name with .test.ts
ChessBoard.test.tsx
gameHelpers.test.ts
api.test.ts

# ✅ API routes: lowercase with hyphens
/api/game/create/route.ts
/api/tournament/[id]/route.ts
```

#### Type Safety
```typescript
// ✅ Always use explicit types
function calculateScore(moves: Move[]): number {
  return moves.length;
}

// ✅ Prefer interfaces over types for objects
interface Player {
  id: string;
  name: string;
  rating: number;
}

// ✅ Use type for unions and primitives
type Color = 'white' | 'black';
type GameStatus = 'pending' | 'active' | 'completed';

// ✅ Avoid any - use unknown if type is truly unknown
// ❌ Bad: const data: any = fetchData();
// ✅ Good: const data: unknown = fetchData();

// ✅ Use generics for reusable components
function processArray<T>(items: T[]): T[] {
  return items;
}

// ✅ Strict null checks
function getMove(id?: string): Move | null {
  if (!id) return null;
  return findMove(id);
}
```

#### Function Guidelines
```typescript
// ✅ Use arrow functions for callbacks and inline functions
const handleClick = (e: MouseEvent) => {
  e.preventDefault();
};

// ✅ Use function declarations for top-level functions
export function validateMove(move: Move): boolean {
  return true;
}

// ✅ Destructure parameters when possible
function createGame({ white, black, timeControl }: GameConfig) {
  // Implementation
}

// ✅ Default parameters over conditionals
function getDepth(depth: number = 4) {
  return depth;
}

// ✅ Early returns for guard clauses
function processMove(move: Move): MoveResult {
  if (!move) {
    throw new Error('Move is required');
  }
  
  if (!isValid(move)) {
    return { success: false, error: 'Invalid move' };
  }
  
  // Main logic here
  return { success: true };
}
```

#### Async/Await
```typescript
// ✅ Always use async/await over promises
async function fetchGame(id: string): Promise<Game> {
  try {
    const response = await fetch(`/api/game/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch game ${id}:`, error);
    throw error;
  }
}

// ✅ Parallel execution when possible
const [game, models, tournament] = await Promise.all([
  fetchGame(gameId),
  fetchModels(),
  fetchTournament(tournamentId)
]);

// ✅ Proper error handling
try {
  const result = await riskyOperation();
} catch (error) {
  // Log error with context
  console.error('[GameEngine] Operation failed:', error);
  // Re-throw or handle appropriately
  throw new Error(`Game operation failed: ${error.message}`);
}
```

### React/Next.js Components

#### Component Structure
```tsx
// ✅ Functional components with TypeScript
import { useState, useEffect } from 'react';
import type { FC } from 'react';

interface ChessBoardProps {
  gameId: string;
  onMove: (move: Move) => void;
  disabled?: boolean;
}

export const ChessBoard: FC<ChessBoardProps> = ({
  gameId,
  onMove,
  disabled = false
}) => {
  // 1. Hooks first
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const { game, loading, error } = useGame(gameId);
  
  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, [gameId]);
  
  // 3. Handlers
  const handleSquareClick = (square: Square) => {
    if (disabled) return;
    setSelectedSquare(square);
  };
  
  // 4. Early returns for loading/error states
  if (loading) return <BoardSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  // 5. Main render
  return (
    <div className="chess-board">
      {/* Component JSX */}
    </div>
  );
};
```

#### Hooks Guidelines
```typescript
// ✅ Custom hooks start with 'use'
function useGameState(gameId: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchGame(gameId).then(setGame).finally(() => setLoading(false));
  }, [gameId]);
  
  return { game, loading };
}

// ✅ Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ Memoize callbacks passed to children
const handleMove = useCallback((move: Move) => {
  processMove(move);
}, []);
```

### CSS/Tailwind

#### Tailwind Classes Order
```tsx
// ✅ Order: Layout → Spacing → Sizing → Typography → Colors → Effects
<div className="
  flex flex-col items-center justify-between
  p-4 m-2
  w-full h-64
  text-lg font-bold
  bg-white text-gray-900
  rounded-lg shadow-lg hover:shadow-xl
  transition-all duration-200
">

// ✅ Responsive modifiers: mobile-first
<div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">

// ✅ State modifiers at the end
<button className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400">
```

#### Component Styling
```tsx
// ✅ Use Tailwind for utility classes
<div className="flex items-center space-x-4">

// ✅ Use CSS modules for complex components
import styles from './ChessBoard.module.css';
<div className={styles.board}>

// ✅ Use clsx/cn for conditional classes
import { cn } from '@/lib/utils';
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  isDisabled && 'disabled-classes'
)}>
```

### API Design

#### RESTful Endpoints
```typescript
// ✅ Use proper HTTP methods
GET    /api/games           // List games
GET    /api/games/[id]      // Get single game
POST   /api/games           // Create game
PUT    /api/games/[id]      // Update game
DELETE /api/games/[id]      // Delete game

// ✅ Use proper status codes
200 OK                      // Success
201 Created                 // Resource created
204 No Content             // Success, no response body
400 Bad Request            // Client error
401 Unauthorized           // Authentication required
403 Forbidden              // Permission denied
404 Not Found              // Resource not found
422 Unprocessable Entity   // Validation error
500 Internal Server Error  // Server error
```

#### API Response Format
```typescript
// ✅ Consistent response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: number;
    version: string;
  };
}

// ✅ Example implementation
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json({
      success: true,
      data,
      metadata: {
        timestamp: Date.now(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
}
```

### Error Handling

#### Error Classes
```typescript
// ✅ Custom error classes
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class ValidationError extends GameError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

// ✅ Usage
throw new ValidationError('Invalid move', 'move');
```

#### Error Boundaries
```tsx
// ✅ Error boundary for components
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-container">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <ChessBoard />
</ErrorBoundary>
```

### Testing Standards

#### Test Structure
```typescript
// ✅ Describe-it pattern
describe('ChessEngine', () => {
  describe('validateMove', () => {
    it('should accept valid moves', () => {
      const move = { from: 'e2', to: 'e4' };
      expect(validateMove(move)).toBe(true);
    });
    
    it('should reject invalid moves', () => {
      const move = { from: 'e2', to: 'e5' };
      expect(validateMove(move)).toBe(false);
    });
  });
});

// ✅ AAA Pattern: Arrange, Act, Assert
it('should calculate correct score', () => {
  // Arrange
  const moves = [move1, move2, move3];
  
  // Act
  const score = calculateScore(moves);
  
  // Assert
  expect(score).toBe(3);
});
```

#### Test Coverage Requirements
```typescript
// Minimum coverage targets:
// - Statements: 80%
// - Branches: 75%
// - Functions: 80%
// - Lines: 80%

// ✅ Test critical paths
// ✅ Test edge cases
// ✅ Test error scenarios
// ✅ Test async operations
```

### Documentation

#### Code Comments
```typescript
/**
 * Calculates the best move using minimax algorithm with alpha-beta pruning.
 * 
 * @param gameState - Current game state including board and player
 * @param depth - Search depth (default: 4)
 * @param alpha - Alpha value for pruning
 * @param beta - Beta value for pruning
 * @returns Best move with evaluation score
 * 
 * @example
 * const move = calculateBestMove(gameState, 4);
 * console.log(`Best move: ${move.from} to ${move.to}`);
 */
export function calculateBestMove(
  gameState: GameState,
  depth: number = 4,
  alpha: number = -Infinity,
  beta: number = Infinity
): MoveWithEval {
  // Implementation
}

// ✅ Use single-line comments for clarification
const QUIESCENCE_DEPTH = 6; // Additional depth for capture sequences

// ✅ TODO comments with assignee and date
// TODO(john, 2024-01): Optimize this algorithm for quantum states

// ✅ Explain complex logic
// The correlation matrix represents quantum entanglement between pieces.
// A value of 1.0 means pieces are fully entangled, 0.0 means independent.
```

#### JSDoc for APIs
```typescript
/**
 * @api {post} /api/game/create Create a new game
 * @apiName CreateGame
 * @apiGroup Game
 * 
 * @apiParam {String} whiteModel ID of white player model
 * @apiParam {String} blackModel ID of black player model
 * @apiParam {Object} settings Game settings
 * 
 * @apiSuccess {String} gameId Unique game identifier
 * @apiSuccess {String} status Game status
 * 
 * @apiError ValidationError Invalid parameters provided
 * @apiError ServerError Internal server error
 */
```

### Git Commit Messages

#### Format
```bash
# Format: [TASK-ID] type: description

# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation
# style: Code style (formatting, semicolons, etc)
# refactor: Code refactoring
# test: Tests
# perf: Performance improvements
# chore: Maintenance tasks

# ✅ Good examples:
git commit -m "[P1-T1.1] feat: Initialize Next.js project with TypeScript"
git commit -m "[P2-T2.3] fix: Resolve move validation for quantum states"
git commit -m "[P3-T3.2] refactor: Extract thought parsing logic to utility"
git commit -m "[P1-T1.7] test: Add unit tests for chess board component"

# ❌ Bad examples:
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "updates"
```

### Performance Guidelines

#### React Optimization
```tsx
// ✅ Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});

// ✅ Use React.lazy for code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ✅ Virtualize long lists
import { VirtualList } from '@tanstack/react-virtual';

// ✅ Debounce/throttle handlers
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  [handleSearch]
);
```

#### Bundle Optimization
```typescript
// ✅ Dynamic imports for large libraries
const processImage = async (file: File) => {
  const { processImage } = await import('heavy-image-lib');
  return processImage(file);
};

// ✅ Tree-shakeable exports
export { specificFunction } from './utils';
// Instead of: export * from './utils';
```

### Security Best Practices

```typescript
// ✅ Input validation
import { z } from 'zod';

const MoveSchema = z.object({
  from: z.string().regex(/^[a-h][1-8]$/),
  to: z.string().regex(/^[a-h][1-8]$/),
  promotion: z.enum(['queen', 'rook', 'bishop', 'knight']).optional()
});

// ✅ Sanitize user input
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(userInput);

// ✅ Use environment variables for secrets
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required');
}

// ✅ Rate limiting
import { rateLimit } from '@/lib/rate-limit';
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});
```

## 📋 Code Review Checklist

Before submitting PR, ensure:

### Functionality
- [ ] Code performs intended function
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] No console.log statements

### Code Quality
- [ ] Follows naming conventions
- [ ] No duplicate code
- [ ] Functions are focused and small
- [ ] Complex logic is commented

### TypeScript
- [ ] No `any` types
- [ ] Proper type definitions
- [ ] No TypeScript errors
- [ ] Interfaces documented

### Testing
- [ ] Unit tests written
- [ ] Tests are passing
- [ ] Edge cases tested
- [ ] Mocks used appropriately

### Performance
- [ ] No unnecessary re-renders
- [ ] Memoization used where needed
- [ ] API calls optimized
- [ ] Bundle size checked

### Security
- [ ] Input validated
- [ ] No hardcoded secrets
- [ ] SQL injection prevented
- [ ] XSS prevented

## 🔄 Continuous Improvement

This style guide is a living document. Propose changes through PRs with justification for why the change improves code quality, readability, or performance.

---

**Version**: 1.0.0  
**Last Updated**: 2024-12  
**Next Review**: After Phase 1 completion