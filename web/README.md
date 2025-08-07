# Quantum Chess AI Battleground - Web Application

## 🎯 Project Overview

A web-based platform where different AI reasoning models compete in Quantum/Probabilistic Chess, showcasing their thought processes in real-time. This project focuses on LLM reasoning transparency and strategy comparison.

## 📁 Documentation Structure

```
web/
├── doc/                        # Project management documentation
│   ├── AGENT_WORKFLOW.md      # Development workflow and protocols
│   ├── PROJECT_TASKS.md       # Task tracking and milestones
│   └── TECHNICAL_CHECKLIST.md # Technical implementation checklist
└── docs/                       # Technical documentation
    └── PRD_QUANTUM_CHESS_BATTLEGROUND.md # Product requirements
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Vercel CLI (for deployment)

### Setup Instructions

1. **Clone the repository**
```bash
git clone [repository-url]
cd quantum-chess-ai/web
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your API keys and configuration
```

4. **Run development server**
```bash
npm run dev
# Open http://localhost:3000
```

5. **Deploy to Vercel**
```bash
vercel
# Follow prompts for deployment
```

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions, Edge Runtime
- **Database**: Vercel KV (Redis), Vercel Postgres
- **Real-time**: Server-Sent Events (SSE)
- **AI Models**: OpenAI, Anthropic, Custom implementations
- **Deployment**: Vercel

## 📋 Project Structure

```
web/
├── app/                    # Next.js 14 App Directory
│   ├── api/               # API Routes (Serverless)
│   ├── game/              # Game viewer pages
│   ├── tournament/        # Tournament system
│   └── models/            # Model registry
├── components/            # React components
│   ├── board/            # Chess board components
│   ├── reasoning/        # AI reasoning display
│   └── tournament/       # Tournament UI
├── lib/                  # Core logic
│   ├── game-engine/     # Quantum chess engine
│   ├── models/          # AI model implementations
│   └── utils/           # Utilities
└── public/              # Static assets
```

## 🎮 Core Features

### Phase 1: Foundation (Weeks 1-2)
- [ ] Next.js setup with TypeScript
- [ ] Quantum chess game engine
- [ ] Basic board visualization
- [ ] Vercel deployment

### Phase 2: Model Integration (Weeks 3-4)
- [ ] Base model interface
- [ ] Classical AI models (Minimax, MCTS)
- [ ] LLM integration (GPT-4, Claude)
- [ ] Model execution framework

### Phase 3: Real-Time Features (Weeks 5-6)
- [ ] Server-Sent Events for live games
- [ ] 3D board visualization
- [ ] Thought process streaming
- [ ] Move analysis display

### Phase 4: Tournament System (Weeks 7-8)
- [ ] Tournament scheduler
- [ ] ELO rating system
- [ ] Automated match execution
- [ ] Leaderboard

### Phase 5: Advanced Features (Weeks 9-10)
- [ ] Additional LLM reasoning strategies
- [ ] Custom model support
- [ ] Analytics dashboard
- [ ] Research tools

### Phase 6: Polish & Optimization (Weeks 11-12)
- [ ] Performance optimization
- [ ] Documentation
- [ ] Security audit
- [ ] Production launch

## 🤖 AI Models

### Implemented Models
- **Classical**: Minimax, MCTS, Iterative Deepening
- **Neural**: AlphaZero-style, Transformer-based
- **LLM-based**: Chain-of-Thought, ReAct, Tree of Thoughts
- **Hybrid**: Ensemble voting, Quantum-inspired

### Adding New Models
1. Extend `BaseModel` class in `lib/models/base/`
2. Implement required methods
3. Register in model registry
4. Test with existing games

## 🔧 Development Workflow

1. **Before starting any task**:
   - Read `doc/AGENT_WORKFLOW.md`
   - Check `doc/PROJECT_TASKS.md` for priorities
   - Review `doc/TECHNICAL_CHECKLIST.md`

2. **Task workflow**:
   - Select task from PROJECT_TASKS.md
   - Create feature branch
   - Implement with tests
   - Update documentation
   - Create pull request

3. **Commit format**:
   ```
   [PHASE-TASK] type: description
   Example: [P1-T1.1] feat: Initialize Next.js project
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=game-engine

# Run with coverage
npm test -- --coverage

# E2E tests
npm run test:e2e
```

## 📊 Performance Targets

- Page load time: < 2s
- Move generation: < 5s (p95)
- Concurrent games: > 100
- API response: < 200ms (p95)
- Lighthouse score: > 90

## 🔒 Security

- Input validation on all endpoints
- Rate limiting implemented
- API key management
- CORS properly configured
- Security headers in place

## 🚀 Deployment

The application is configured for automatic deployment to Vercel:

1. Push to `main` branch triggers production deployment
2. Pull requests create preview deployments
3. Environment variables managed in Vercel dashboard

## 📝 Contributing

1. Read the workflow documentation in `doc/`
2. Pick a task from `PROJECT_TASKS.md`
3. Follow the development workflow
4. Ensure tests pass
5. Update relevant documentation

## 📄 License

[License Type] - See LICENSE file for details

## 🆘 Support

- Check documentation in `doc/` and `docs/`
- Open an issue for bugs
- Discussions for feature requests

## 🔗 Links

- [Live Demo](https://your-app.vercel.app)
- [Documentation](./doc/AGENT_WORKFLOW.md)
- [Task Board](./doc/PROJECT_TASKS.md)
- [Technical Specs](./doc/TECHNICAL_CHECKLIST.md)

---

**Current Status**: Phase 1 - Foundation Setup  
**Last Updated**: December 2024  
**Version**: 0.1.0