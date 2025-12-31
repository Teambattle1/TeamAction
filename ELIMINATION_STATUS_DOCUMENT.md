# 🎯 ELIMINATION GAME MODE - STATUS DOCUMENT

**Project**: ELIMINATION - GPS-Based Capture The Flag Game  
**Status**: 🔄 **PLANNING PHASE COMPLETE**  
**Start Date**: December 2025  
**Estimated Completion**: 3-4 weeks  
**Priority**: High  

---

## 📊 CURRENT STATUS SUMMARY

### Planning Phase: ✅ COMPLETE
- ✅ Analyzed Capture The Flag mechanics from research
- ✅ Designed core game mechanics
- ✅ Created comprehensive feature plan (523 lines)
- ✅ Identified all required components
- ✅ Defined success criteria
- ✅ Created implementation roadmap

### Development Phase: 🔄 READY TO START
- ⏳ Core map system
- ⏳ Task elimination logic
- ⏳ Team leaderboards
- ⏳ Bomb/danger zone system
- ⏳ Real-time tracking

### Testing Phase: 📋 PLANNED
- 📋 Unit tests
- 📋 Integration tests
- 📋 E2E tests
- 📋 Performance testing

---

## 🎮 GAME CONCEPT OVERVIEW

**ELIMINATION** is a competitive GPS-based Capture The Flag game where teams race to solve tasks scattered across a map. Key innovations:

### Core Mechanics:
```
🗺️  GPS-based tasks scattered on live map
👥  All team locations always visible (solid colors)
⚡  First team to solve task → task disappears for others
📊  Ranking: # of captured tasks (not points)
💣  Strategic bomb drops to slow opponents
⏱️  2-minute cooldown on wrong attempts
🏆  Leaderboard updates in real-time
```

### Game Flow:
```
1. All teams see same map with task locations
2. Teams navigate to tasks via GPS
3. First team to solve = task captured ✅
4. Task disappears from other teams' screens
5. Team adds task to their "captured playground"
6. Leaderboard updates instantly
7. Most captured tasks at end = WINNER
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### Game Type Hierarchy:
```
Game (base type)
├── Standard Game (GPS-based, traditional)
├── Playzone Game (indoor, touch-based, NEW)
└── Elimination Game (GPS-based, CTF, NEW) ← We are here
```

### Key Differences:
```
                Standard    Playzone    ELIMINATION
GPS Map         ✅          ❌          ✅
Playgrounds     Optional    ✅          ✅
Task Hiding     Never       N/A         ✅ (disappears when captured)
Team Visibility Optional    ❌          ✅ ALWAYS
Leaderboard     Points      Tasks       Tasks (Captured)
Cooldown        None        None        2 minutes
Bombs           No          No          ✅ Yes (3 per team)
Real-time       Periodic    Periodic    ✅ Instant
Competitive     Low         Low         ✅ HIGH
```

---

## 📋 FEATURE BREAKDOWN

### 1. GPS-Based Map System
**Status**: 📋 Ready to implement  
**Components**: EliminationGameMode.tsx, MapLayer  
**Complexity**: Medium  
**Dependencies**: Existing GameMap component  

**What it does:**
- Shows all task locations as numbered pins on map
- Shows all team locations as solid color circles
- Real-time position tracking (~5 sec updates)
- Shows danger zones (red circles, 30m radius)

---

### 2. Task Elimination System
**Status**: 📋 Ready to implement  
**Components**: TaskCaptureHandler, TaskStatusManager  
**Complexity**: Medium  
**Dependencies**: Task solving logic, database updates  

**What it does:**
- When team solves a task correctly, mark it as "captured by Team X"
- Remove task from all other teams' map views
- Add task to capturing team's "playground"
- Update leaderboard instantly
- Prevent other teams from solving that task

---

### 3. Team Identification & Colors
**Status**: 📋 Ready to implement  
**Components**: TeamColorAssigner, TeamMarker  
**Complexity**: Low  
**Dependencies**: Team setup phase  

**What it does:**
- Assign unique solid color to each team (Blue, Red, Green, Yellow, Orange, Purple, Gray, Pink)
- Display team marker on map with team color
- Show team color in leaderboard and playgrounds
- Consistent color throughout game

---

### 4. Failure & Cooldown System
**Status**: 📋 Ready to implement  
**Components**: CooldownManager, AttemptTracker  
**Complexity**: Medium  
**Dependencies**: Task attempt logic, timer system  

**What it does:**
- When team answers wrong, start 2-minute cooldown
- Prevent retry of that specific task during cooldown
- Allow team to attempt OTHER tasks during cooldown
- Visual timer showing remaining cooldown
- Auto-enable task retry after cooldown expires

---

### 5. Bomb & Danger Zone System
**Status**: 📋 Ready to implement  
**Components**: BombPlacementModal, DangerZoneVisualizer, BombManager  
**Complexity**: High  
**Dependencies**: Location tracking, visual effects, penalty system  

**What it does:**
- Each team gets 3 bombs per game (30s, 1min, 2min durations)
- Place bombs on map at selected locations
- Create danger zones (red circles, 30m radius)
- Teams entering zone during countdown: -300 points or status mark
- Visual countdown and explosion effect

---

### 6. Team Playgrounds Display
**Status**: 📋 Ready to implement  
**Components**: TeamPlaygroundView, CapturedTasksList  
**Complexity**: Medium  
**Dependencies**: Captured task tracking, state management  

**What it does:**
- Show each team's captured tasks in dedicated view
- Display capture timestamp for each task
- Show progress: "3 / 10 tasks captured"
- Accessible from main leaderboard
- Shows status to all teams (helps with strategy)

---

### 7. Real-Time Leaderboard
**Status**: 📋 Ready to implement  
**Components**: EliminationLeaderboard, LiveRankingDisplay  
**Complexity**: Medium  
**Dependencies**: Real-time data updates, WebSocket/polling  

**What it does:**
- Display live ranking based on captured task count
- Show bombs remaining per team
- Update instantly when task captured
- Update when bombs placed/detonated
- Show team colors and names

---

## 💾 DATABASE SCHEMA ADDITIONS

### New Fields in Game Table:
```typescript
interface EliminationGame extends Game {
  // Mode identifier
  gameMode: 'elimination';
  
  // Team colors mapping
  teamColors: {
    [teamId: string]: string; // hex color code
  };
  
  // Task capture tracking
  capturedTasks: {
    [taskId: string]: string; // teamId who captured
  };
  
  // Failed attempts tracking
  failedAttempts: Array<{
    taskId: string;
    teamId: string;
    timestamp: number;
  }>;
  
  // Bombs placed
  bombs: Array<{
    id: string;
    teamId: string;
    location: { lat: number; lng: number };
    duration: 30 | 60 | 120;
    createdAt: number;
    detonatesAt: number;
  }>;
  
  // Team capture counts
  teamCaptureCount: {
    [teamId: string]: number;
  };
}
```

---

## 🔌 API ENDPOINTS NEEDED

### New Endpoints Required:
```
POST /api/games/{gameId}/tasks/{taskId}/capture
  - Called when team solves task correctly
  - Records capture, removes from others, updates leaderboard

POST /api/games/{gameId}/bombs
  - Place bomb at location with duration
  - Creates danger zone for all teams

POST /api/games/{gameId}/team/{teamId}/location
  - Update team's current GPS location
  - Called every 5 seconds during gameplay

GET /api/games/{gameId}/elimination/status
  - Real-time game status
  - Current leaderboard
  - Bomb/cooldown info
  - Captured tasks per team

GET /api/games/{gameId}/team/{teamId}/playground
  - Get team's captured task list
  - Used for team playground display
```

---

## 🧪 TESTING STRATEGY

### Unit Tests:
```
✓ Task capture logic
✓ Cooldown manager
✓ Bomb placement validation
✓ Team color assignment
✓ Leaderboard calculations
```

### Integration Tests:
```
✓ Task capture triggers leaderboard update
✓ Cooldown prevents retries
✓ Bomb creates danger zone
✓ Captured tasks disappear from map
✓ Real-time updates sync across teams
```

### E2E Tests:
```
✓ Complete game flow (start to finish)
✓ Multiple teams playing simultaneously
✓ Bomb placement and trigger
✓ Cooldown and retry flow
✓ Leaderboard accuracy
```

---

## 🎯 SUCCESS METRICS

### Technical:
- Map updates < 200ms latency ✅
- Real-time leaderboard accuracy ✅
- 0 data inconsistencies ✅
- Mobile performance optimal ✅

### User Experience:
- Clear visual team identification ✅
- Intuitive bomb placement ✅
- Strategic depth appreciated ✅
- Competitive engagement high ✅

### Gameplay:
- Balanced competitive experience ✅
- All features working as designed ✅
- No exploits or cheating opportunities ✅
- Replayable and fun ✅

---

## 📅 IMPLEMENTATION TIMELINE

### Week 1:
```
Day 1-2: Core map system
  - Extend Game type
  - Create EliminationGameMode component
  - GPS task placement
  - Basic team location display

Day 3-4: Task elimination logic
  - Task capture handler
  - Elimination status tracking
  - Task removal from maps

Day 5: Integration & testing
  - Connect map with task capture
  - Initial testing
```

### Week 2:
```
Day 1-2: Leaderboard & playgrounds
  - Real-time leaderboard
  - Team playground view
  - Live updates system

Day 3-4: Cooldown system
  - Failed attempt tracking
  - 2-minute cooldown logic
  - UI feedback

Day 5: Integration & testing
```

### Week 3:
```
Day 1-3: Bomb system
  - Bomb placement modal
  - Danger zone visualization
  - Penalty system
  - Countdown management

Day 4-5: Testing & refinement
```

### Week 4:
```
- Comprehensive testing
- Performance optimization
- Bug fixes
- Polish & final adjustments
- Deployment preparation
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code review complete
- [ ] Documentation complete
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Database schema deployed

### Deployment:
- [ ] Database migrations applied
- [ ] API endpoints deployed
- [ ] Frontend code deployed
- [ ] Feature flags enabled
- [ ] Monitoring active

### Post-Deployment:
- [ ] All systems operational
- [ ] No error spikes
- [ ] User feedback monitored
- [ ] Hotfix plan ready

---

## 🎮 GAME TYPES SUMMARY

### Available Game Modes:
```
1. STANDARD GAME
   - Classic GPS-based outdoor game
   - All tasks visible on map
   - Points-based scoring
   - No competitive mechanics

2. PLAYZONE GAME (NEW - Completed)
   - Indoor, touch-based
   - No GPS navigation
   - Playground-based tasks
   - Simple team entry (QR/name)

3. ELIMINATION GAME (NEW - Planning Complete)
   - GPS-based competitive
   - Task elimination on capture
   - Real-time leaderboards
   - Strategic bomb system
```

---

## 📝 DOCUMENTATION

### Completed:
- ✅ ELIMINATION_GAME_FEATURE_PLAN.md (523 lines)
- ✅ ELIMINATION_STATUS_DOCUMENT.md (this file)

### To Be Created:
- 📋 ELIMINATION_API_DOCUMENTATION.md
- 📋 ELIMINATION_DATABASE_SCHEMA.md
- 📋 ELIMINATION_TESTING_GUIDE.md
- 📋 ELIMINATION_IMPLEMENTATION_GUIDE.md

---

## 🔗 RELATED DOCUMENTS

- PLAYZONE_GAME_FEATURE_PLAN.md - Indoor game mode
- PLAYZONE_COMPLETION_SUMMARY.md - Playzone implementation summary
- PLAYZONE_CODE_REVIEW.md - Code quality for similar features

---

## ✨ KEY INNOVATION POINTS

### What Makes ELIMINATION Special:
1. **Dynamic Task Visibility** - Tasks disappear when captured (unique)
2. **Always-On Team Tracking** - Strategic element of knowing opponent positions
3. **Cooldown Penalty** - Forces team to explore rather than brute force
4. **Bomb System** - Adds tactical depth and dynamic obstacles
5. **Playground Leaderboard** - Visual representation of team progress
6. **Real-Time Updates** - Instant feedback for competitive engagement

### Competitive Advantages:
- ✅ More strategic than standard game
- ✅ More dynamic than playzone game
- ✅ Higher engagement factor
- ✅ Unique mechanics (task elimination)
- ✅ Large-scale scalability (8+ teams)

---

## 🎊 FINAL STATUS

### Current Phase: 🔄 PLANNING COMPLETE ✅
- Comprehensive feature plan created
- Architecture designed
- Database schema outlined
- API endpoints defined
- Testing strategy defined
- Timeline established
- Success criteria set

### Ready For: 👷 DEVELOPMENT
- All planning documents complete
- All decisions made
- Ready to begin implementation
- Week 1 can start immediately

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Status**: 🟢 READY FOR DEVELOPMENT  

---

