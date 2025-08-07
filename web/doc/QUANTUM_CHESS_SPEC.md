# Quantum Chess Specification

## Overview
Quantum Chess extends traditional chess by incorporating quantum mechanical principles, allowing pieces to exist in superposition, become entangled, and exhibit probabilistic behavior. This document defines the rules, mechanics, and implementation details.

## Core Quantum Concepts

### 1. Superposition
A piece can exist in multiple positions simultaneously with associated probabilities.
- Created through **split moves**
- Probabilities sum to 1 across all positions
- Visually represented by semi-transparent pieces with probability percentages

### 2. Entanglement
Two or more pieces become quantum mechanically linked.
- Created when pieces interact in superposition
- Measuring one piece affects the state of entangled pieces
- Shown with visual connections between entangled pieces

### 3. Measurement (Collapse)
Quantum states collapse to classical states when observed.
- Triggered by captures or explicit measurement
- Probabilistic outcome based on quantum amplitudes
- Irreversible operation

## Quantum Move Types

### Normal Move
Standard chess move with no quantum effects.
```
Notation: e2-e4
Effect: Piece moves classically from source to destination
```

### Split Move
Creates superposition by moving a piece to two locations simultaneously.
```
Notation: e2 → e3+e4
Requirements:
- Single piece at source
- Two valid destination squares
- Both moves must be legal in classical chess

Effect:
- Original piece enters superposition
- 50% probability at each destination (initially)
- Piece exists in both locations until measured
```

### Merge Move
Collapses superposition by combining quantum states.
```
Notation: e3+e4 → d5
Requirements:
- Two source pieces in superposition (same piece)
- Single valid destination
- Move must be legal from at least one source

Effect:
- Superposition collapses
- Single piece appears at destination
- Probability determines which path was "taken"
```

### Quantum Capture
Capturing a piece in superposition triggers measurement.
```
Scenario: White pawn captures black piece in superposition
Process:
1. Measurement occurs with probability of piece being present
2. If present (measurement succeeds): Capture proceeds normally
3. If absent (measurement fails): Move is invalid, piece wasn't there
4. All entangled pieces collapse accordingly
```

## Quantum Rules

### Rule 1: Superposition Limits
- Maximum 4 simultaneous superpositions per piece
- Total probability must always equal 1
- Minimum probability threshold: 0.1 (10%)

### Rule 2: Entanglement Creation
Pieces become entangled when:
- They pass through each other in superposition
- A split move creates correlated positions
- Quantum captures create entanglement

### Rule 3: Measurement Triggers
Measurement/collapse occurs when:
- A piece attempts to capture
- A piece is captured
- Explicit measurement is requested
- Check or checkmate involves quantum pieces

### Rule 4: Quantum Check
- King in superposition: Check applies to all positions
- Attacking piece in superposition: Probabilistic check
- Resolution: Measurement may be forced

### Rule 5: Quantum Castling
- King and rook must be in classical states
- Path must be clear (no superposition blocking)
- Standard castling rules apply

### Rule 6: Quantum En Passant
- Capturing pawn must be classical
- Target pawn can be in superposition
- Measurement determines if capture succeeds

## Implementation Details

### State Representation
```typescript
interface QuantumState {
  position: number;      // 0-63 board index
  amplitude: Complex;    // Quantum amplitude
  probability: number;   // |amplitude|²
}

interface QuantumPiece {
  type: PieceType;
  color: Color;
  states: QuantumState[];
  entangled: Set<PieceId>;
}
```

### Quantum Operations

#### iSWAP Gate
Used for split moves, creates superposition:
```
|10⟩ → 1/√2(|10⟩ - i|01⟩)
|01⟩ → 1/√2(|01⟩ - i|10⟩)
```

#### √iSWAP Gate
Partial entanglement operation:
```
Applied twice = full iSWAP
Used for gradual quantum transitions
```

#### Measurement
Collapses quantum state based on probability:
```typescript
function measure(piece: QuantumPiece): Position {
  const random = Math.random();
  let cumulative = 0;
  
  for (const state of piece.states) {
    cumulative += state.probability;
    if (random < cumulative) {
      return state.position;
    }
  }
}
```

## Visual Indicators

### Piece Rendering
- **Opacity**: Proportional to probability (30% - 100%)
- **Glow**: Indicates superposition (purple)
- **Pulse**: Shows entanglement (blue)
- **Number**: Probability percentage

### Board Highlighting
- **Green dots**: Valid normal moves
- **Purple dots**: Valid split destinations
- **Blue dots**: Valid merge destinations
- **Red outline**: Measurement will occur

### Quantum State Panel
- List of all quantum pieces
- Probability distributions
- Entanglement graph
- Recent measurements

## User Interface

### Move Modes
1. **Normal Mode** (N key): Standard chess moves
2. **Split Mode** (S key): Create superposition
3. **Merge Mode** (M key): Collapse superposition
4. **Measure Mode** (Q key): Force measurement

### Selection Process

#### Split Move:
1. Enter Split Mode
2. Select source piece
3. Select first destination (highlighted)
4. Select second destination (highlighted)
5. Confirm or cancel

#### Merge Move:
1. Enter Merge Mode
2. Select first source piece (must be in superposition)
3. Select second source piece (must be same piece)
4. Select destination
5. Confirm or cancel

### Move Notation

#### Standard Quantum Notation (SQN)
```
Normal:  e2-e4
Split:   e2→e3+e4 (50%/50%)
Merge:   e3+e4→d5
Capture: e4×d5! (measurement)
Quantum: e4×d5? (probabilistic)
```

#### Extended Notation
```
e2→e3+e4 [0.5|0.5] {entangled: d7}
e4×d5! [measured→0.7] {collapsed: d7→d6}
```

## Edge Cases

### Quantum Checkmate
- All king positions must be in checkmate
- Measurement may save the king
- Probabilistic checkmate possible

### Quantum Stalemate
- No legal moves in any quantum state
- Extremely rare due to quantum possibilities

### Quantum Draw Conditions
- Threefold repetition includes quantum states
- 50-move rule counts quantum moves
- Insufficient material considers probabilities

## Performance Considerations

### Optimization Strategies
1. **Sparse state representation**: Only store non-zero amplitudes
2. **Lazy evaluation**: Calculate probabilities on demand
3. **State pruning**: Remove states below threshold (0.01)
4. **Caching**: Store frequently accessed calculations

### Complexity Limits
- Maximum 32 simultaneous quantum states
- Maximum 8 entangled pieces
- Measurement cascade depth limit: 4

## Testing Requirements

### Unit Tests
- Quantum operation correctness
- Probability conservation
- Entanglement consistency
- Measurement outcomes

### Integration Tests
- Complete quantum games
- Edge case handling
- Performance benchmarks
- UI interaction flows

### Validation Tests
- All moves follow quantum rules
- No probability leaks
- Correct state collapse
- Proper entanglement propagation

## Future Enhancements

### Phase 2 Features
- Quantum tunneling (pieces pass through others)
- Quantum interference patterns
- Multi-particle entanglement
- Quantum teleportation moves

### Advanced Visualizations
- Wavefunction visualization
- Probability heat maps
- Entanglement network graph
- Quantum circuit representation

### AI Considerations
- Quantum position evaluation
- Superposition strategy
- Entanglement tactics
- Measurement timing optimization