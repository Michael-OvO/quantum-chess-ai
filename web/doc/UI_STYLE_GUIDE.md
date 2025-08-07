# Quantum Chess AI Battleground - UI Style Guide

## Design Philosophy

**Tech-Forward Gaming Platform with Quantum Aesthetics**

The Quantum Chess platform follows a sophisticated gaming design philosophy that blends classic chess elegance with futuristic quantum visualization. The interface emphasizes clarity for game state comprehension while showcasing the complexity of AI reasoning and quantum mechanics.

### Core Principles

1. **Layered Visual Hierarchy** - Clear separation between board, UI controls, and AI reasoning panels
2. **Quantum Color Language** - Dark theme with vibrant quantum state indicators
3. **Smooth State Transitions** - Fluid animations for piece movement and quantum effects
4. **Information Density Balance** - Rich data presentation without overwhelming the viewer
5. **Spectator-First Experience** - Optimized for watching and understanding AI battles

## Color System

### Primary Palette

```css
/* Dark Theme (Primary) */
--color-bg-primary: #0a0f14;        /* Deep space black background */
--color-bg-secondary: #141b22;      /* Elevated surface */
--color-bg-tertiary: #1c252e;       /* Cards and panels */
--color-bg-board: #1a1f26;          /* Chess board background */

/* Light Theme (Optional) */
--color-bg-primary: #fafbfc;        /* Clean white background */
--color-bg-secondary: #ffffff;      /* Pure white surfaces */
--color-bg-board: #f5f7fa;          /* Soft board background */

/* Text Colors */
--color-text-primary: #ffffff;      /* Primary text (dark mode) */
--color-text-secondary: #94a3b8;    /* Secondary text */
--color-text-muted: #64748b;        /* Muted labels */
```

### Chess Piece Colors

```css
/* Classic Chess Pieces */
--color-piece-white: #ffffff;       /* White pieces */
--color-piece-white-stroke: #e2e8f0; /* White piece outlines */
--color-piece-black: #1e293b;       /* Black pieces */
--color-piece-black-stroke: #0f172a; /* Black piece outlines */

/* Board Squares */
--color-square-light: #f0d9b5;      /* Traditional light squares */
--color-square-dark: #b58863;       /* Traditional dark squares */
--color-square-highlight: rgba(255, 204, 0, 0.5); /* Last move */
--color-square-selected: rgba(130, 151, 105, 0.6); /* Selected piece */
```

### Quantum State Colors

```css
/* Quantum Visualization */
--color-quantum-superposition: #8b5cf6;  /* Purple for superposition */
--color-quantum-entangled: #3b82f6;      /* Blue for entanglement */
--color-quantum-collapsed: #10b981;      /* Green for measurement */
--color-quantum-probability: #fbbf24;    /* Amber for probability */

/* Quantum Overlays */
--color-quantum-wave: rgba(139, 92, 246, 0.15);
--color-quantum-particle: rgba(59, 130, 246, 0.25);
--color-quantum-glow: rgba(168, 85, 247, 0.4);
```

### AI Reasoning Colors

```css
/* Thought Process Visualization */
--color-ai-thinking: #f59e0b;       /* Amber - Processing */
--color-ai-analyzing: #06b6d4;      /* Cyan - Analysis */
--color-ai-evaluating: #8b5cf6;     /* Purple - Evaluation */
--color-ai-deciding: #10b981;       /* Green - Decision */
--color-ai-confident: #3b82f6;      /* Blue - High confidence */
--color-ai-uncertain: #ef4444;      /* Red - Low confidence */

/* Model Type Indicators */
--color-model-classical: #6366f1;   /* Indigo - Classical AI */
--color-model-neural: #ec4899;      /* Pink - Neural Networks */
--color-model-llm: #14b8a6;         /* Teal - Language Models */
--color-model-quantum: #a855f7;     /* Purple - Quantum-inspired */
```

### Accent & Status Colors

```css
/* Game Status */
--color-status-active: #10b981;     /* Active game */
--color-status-paused: #f59e0b;     /* Paused */
--color-status-completed: #6366f1;  /* Completed */
--color-status-error: #ef4444;      /* Error state */

/* Tournament */
--color-tournament-gold: #fbbf24;   /* First place */
--color-tournament-silver: #94a3b8; /* Second place */
--color-tournament-bronze: #fb923c; /* Third place */
```

## Typography

### Font Stack

```css
/* Primary Display Font */
font-family: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', sans-serif;

/* Body Text */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', sans-serif;

/* Chess Notation & Code */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* AI Reasoning Text */
font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
```

### Font Weights

```css
--font-weight-light: 300;      /* Large displays */
--font-weight-normal: 400;     /* Body text */
--font-weight-medium: 500;     /* UI labels */
--font-weight-semibold: 600;   /* Headings */
--font-weight-bold: 700;       /* Emphasis */
```

### Typography Scale

```css
/* Display Sizes */
--text-display-lg: clamp(2.5rem, 5vw, 4rem);      /* Hero text */
--text-display-md: clamp(2rem, 4vw, 3rem);        /* Section headers */
--text-display-sm: clamp(1.5rem, 3vw, 2rem);      /* Subsections */

/* UI Text */
--text-heading: 1.5rem;        /* Card headings */
--text-subheading: 1.125rem;   /* Subheadings */
--text-body: 1rem;              /* Body text */
--text-small: 0.875rem;         /* Secondary text */
--text-tiny: 0.75rem;           /* Labels */

/* Chess Notation */
--text-notation: 0.9rem;        /* Move notation */
--text-coordinate: 0.75rem;    /* Board coordinates */
```

## Spacing System

### Grid System

```css
/* 8px base grid */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Layout Spacing

```css
/* Container Padding */
--padding-mobile: 1rem;
--padding-tablet: 1.5rem;
--padding-desktop: 2rem;

/* Section Spacing */
--section-gap: 3rem;
--component-gap: 1.5rem;
--element-gap: 0.75rem;
```

## Chess Board Design

### Board Layout

```css
/* Board Dimensions */
--board-size: min(80vw, 600px);
--square-size: calc(var(--board-size) / 8);
--piece-size: calc(var(--square-size) * 0.8);

/* Board Styling */
.chess-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 0;
  border: 2px solid var(--color-bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

/* Square Patterns */
.square-light {
  background: var(--color-square-light);
}

.square-dark {
  background: var(--color-square-dark);
}

/* Coordinate Labels */
.board-coordinate {
  position: absolute;
  font-size: var(--text-coordinate);
  font-weight: 500;
  color: var(--color-text-muted);
}
```

### Piece Design

```css
/* Piece Container */
.chess-piece {
  width: var(--piece-size);
  height: var(--piece-size);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Piece States */
.chess-piece:hover {
  transform: scale(1.05);
}

.chess-piece.dragging {
  cursor: grabbing;
  transform: scale(1.1);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
}

/* Quantum States */
.chess-piece.superposition {
  opacity: 0.7;
  filter: blur(0.5px);
  animation: quantum-flicker 2s infinite;
}

.chess-piece.entangled::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid var(--color-quantum-entangled);
  border-radius: 50%;
  animation: quantum-pulse 1.5s infinite;
}
```

## Quantum Visualization

### Superposition Effects

```css
@keyframes quantum-flicker {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.9; }
}

@keyframes quantum-pulse {
  0% { 
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* Probability Overlay */
.probability-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: var(--color-quantum-probability);
  color: black;
  font-size: var(--text-tiny);
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 4px;
}
```

### Entanglement Visualization

```css
/* Entanglement Lines */
.entanglement-line {
  stroke: var(--color-quantum-entangled);
  stroke-width: 2;
  stroke-dasharray: 5, 5;
  animation: entanglement-flow 2s linear infinite;
  opacity: 0.6;
}

@keyframes entanglement-flow {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -10; }
}
```

## AI Reasoning Display

### Thought Stream

```css
/* Thought Container */
.thought-stream {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: var(--space-4);
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--color-bg-tertiary);
}

/* Thought Bubble */
.thought-bubble {
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  padding: var(--space-3);
  margin-bottom: var(--space-2);
  border-left: 3px solid var(--color-ai-thinking);
  animation: slideInRight 0.3s ease-out;
}

/* Thought Types */
.thought-bubble.analysis {
  border-left-color: var(--color-ai-analyzing);
}

.thought-bubble.evaluation {
  border-left-color: var(--color-ai-evaluating);
}

.thought-bubble.decision {
  border-left-color: var(--color-ai-deciding);
  background: rgba(16, 185, 129, 0.1);
}

/* Confidence Meter */
.confidence-meter {
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    var(--color-ai-uncertain) 0%,
    var(--color-ai-confident) 100%);
  transition: width 500ms ease-out;
}
```

### Move Evaluation

```css
/* Evaluation Bar */
.evaluation-bar {
  display: flex;
  height: 32px;
  background: var(--color-bg-secondary);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-bg-tertiary);
}

.evaluation-white {
  background: linear-gradient(90deg, #f0f0f0, #ffffff);
  transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

.evaluation-black {
  background: linear-gradient(90deg, #1e293b, #0f172a);
  transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Best Move Indicator */
.best-move-arrow {
  stroke: var(--color-ai-deciding);
  stroke-width: 3;
  fill: none;
  filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.5));
  animation: pulse-glow 1s infinite;
}
```

## Animation & Motion

### Core Animations

```css
/* Timing Functions */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Durations */
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-move: 400ms;  /* Chess piece movement */
```

### Piece Movement

```css
/* Move Animation */
@keyframes piece-move {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1) translateY(-10px);
  }
  100% {
    transform: scale(1);
  }
}

/* Capture Animation */
@keyframes piece-capture {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5) rotate(180deg);
  }
}

/* Castle Animation */
.castling {
  animation: castle-slide 400ms ease-in-out;
}
```

### UI Transitions

```css
/* Page Transitions */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 300ms var(--ease-smooth);
}

/* Card Hover */
.game-card {
  transition: all 200ms var(--ease-smooth);
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

## Component Patterns

### Game Cards

```css
/* Game Card */
.game-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-bg-tertiary);
  border-radius: 12px;
  padding: var(--space-4);
  transition: all 200ms var(--ease-smooth);
}

.game-card:hover {
  border-color: var(--color-quantum-superposition);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.1);
}

/* Live Game Indicator */
.live-badge {
  background: var(--color-status-active);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: 4px;
  font-size: var(--text-tiny);
  font-weight: 600;
  animation: pulse 2s infinite;
}
```

### Tournament Brackets

```css
/* Bracket Container */
.tournament-bracket {
  background: var(--color-bg-primary);
  padding: var(--space-6);
  overflow-x: auto;
}

/* Match Card */
.match-card {
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-bg-tertiary);
  border-radius: 8px;
  padding: var(--space-3);
  min-width: 200px;
}

.match-card.active {
  border-color: var(--color-status-active);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}

/* Bracket Lines */
.bracket-connector {
  stroke: var(--color-bg-tertiary);
  stroke-width: 2;
  fill: none;
}
```

### Control Buttons

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, 
    var(--color-quantum-superposition), 
    var(--color-quantum-entangled));
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  font-weight: 500;
  transition: all 200ms var(--ease-smooth);
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-bg-tertiary);
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  transition: all 200ms var(--ease-smooth);
}

.btn-secondary:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-quantum-superposition);
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-bg-tertiary);
  transition: all 150ms var(--ease-smooth);
}

.btn-icon:hover {
  background: var(--color-bg-tertiary);
  transform: scale(1.05);
}
```

## Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Ultra-wide */
```

### Layout Adaptations

```css
/* Mobile Layout */
@media (max-width: 767px) {
  .game-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .chess-board {
    --board-size: 90vw;
  }
  
  .thought-stream {
    max-height: 200px;
  }
}

/* Tablet Layout */
@media (min-width: 768px) and (max-width: 1023px) {
  .game-layout {
    grid-template-columns: 2fr 1fr;
    gap: var(--space-6);
  }
  
  .chess-board {
    --board-size: 60vw;
  }
}

/* Desktop Layout */
@media (min-width: 1024px) {
  .game-layout {
    grid-template-columns: 1fr 600px 1fr;
    gap: var(--space-8);
  }
  
  .chess-board {
    --board-size: 600px;
  }
}
```

## Dark Mode Implementation

```css
/* Automatic Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    /* Dark theme is default */
  }
}

/* Light Mode Override */
[data-theme="light"] {
  --color-bg-primary: #fafbfc;
  --color-bg-secondary: #ffffff;
  --color-bg-tertiary: #f1f5f9;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  /* ... other light mode variables */
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --color-bg-primary: #000000;
    --color-text-primary: #ffffff;
    /* Enhanced contrast ratios */
  }
}
```

## Accessibility Features

### Focus States

```css
/* Keyboard Focus */
:focus-visible {
  outline: 2px solid var(--color-quantum-superposition);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip to Content */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-bg-secondary);
  padding: var(--space-2) var(--space-4);
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Screen Reader Support

```css
/* Visually Hidden but Accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Live Region for Updates */
.live-region {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
```

## Performance Optimization

### CSS Performance

```css
/* Hardware Acceleration */
.animated-element {
  will-change: transform;
  transform: translateZ(0);
}

/* Reduce Paint Areas */
.static-element {
  contain: layout style paint;
}

/* Optimize Animations */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Implementation Checklist

### Board Components
- [ ] 8x8 chess board with proper square colors
- [ ] Piece sprites or Unicode symbols
- [ ] Drag-and-drop functionality
- [ ] Move validation highlighting
- [ ] Last move indicator
- [ ] Coordinate labels

### Quantum Features
- [ ] Superposition visualization
- [ ] Entanglement indicators
- [ ] Probability displays
- [ ] Collapse animations
- [ ] Wave function representation

### AI Features
- [ ] Thought stream display
- [ ] Confidence meters
- [ ] Evaluation bars
- [ ] Move arrows
- [ ] Model type badges
- [ ] Processing indicators

### UI Components
- [ ] Game cards with hover states
- [ ] Tournament brackets
- [ ] Leaderboards
- [ ] Control buttons
- [ ] Navigation menu
- [ ] Settings panel

### Responsive Design
- [ ] Mobile-optimized board
- [ ] Touch controls
- [ ] Adaptive layouts
- [ ] Readable text at all sizes
- [ ] Proper spacing adjustments

### Performance
- [ ] 60fps animations
- [ ] Optimized re-renders
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Image optimization

## Summary

The Quantum Chess AI Battleground UI emphasizes:

1. **Gaming Excellence** - Professional chess platform aesthetics
2. **Quantum Innovation** - Clear visualization of quantum mechanics
3. **AI Transparency** - Readable and engaging thought processes
4. **Performance First** - Smooth animations and interactions
5. **Dark Mode Default** - Reduced eye strain for extended viewing
6. **Responsive Design** - Excellent experience on all devices
7. **Accessibility** - Full keyboard and screen reader support

Follow these guidelines to create an engaging, professional quantum chess gaming experience.