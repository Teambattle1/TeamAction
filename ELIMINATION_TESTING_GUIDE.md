# 🧪 ELIMINATION MODE - COMPREHENSIVE TESTING GUIDE

## Test Environment Setup

### Prerequisites
- Two or more mobile devices with GPS enabled
- Internet connectivity for all devices
- Test user accounts for each team
- Test game with 3-5 tasks at known locations
- Updated application with all ELIMINATION components

### Test Game Configuration
**Game Name**: "ELIMINATION TEST GAME"
**Game Mode**: ELIMINATION
**Tasks**: 5 GPS tasks at known locations
**Teams**: 2-4 teams
**Expected Duration**: 30-45 minutes per full test session

---

## Unit Tests

### Test 1.1: Task Capture Logic ✅
**File**: `utils/eliminationLogic.ts`
**Function**: `captureTask()`

**Setup**:
```javascript
const game = { points: [{ id: 'task1', title: 'Task 1' }], capturedTasks: {} };
const teamId = 'team-1';
```

**Test**:
```javascript
const updated = captureTask(game, 'task1', teamId);
assert(updated.capturedTasks['task1'] === teamId);
assert(updated.teamCaptureCount[teamId] === 1);
```

**Expected Result**: ✅ Capture recorded correctly

---

### Test 1.2: Cooldown Tracking ✅
**File**: `utils/eliminationLogic.ts`
**Function**: `recordFailedAttempt()` and `isTaskOnCooldown()`

**Setup**:
```javascript
const game = { failedAttempts: [] };
const now = Date.now();
const cooldownUntil = now + 120000; // 2 minutes
```

**Test**:
```javascript
const updated = recordFailedAttempt(game, 'task1', 'team1');
const onCooldown = isTaskOnCooldown(updated, 'task1', 'team1');
assert(onCooldown === true);
assert(getRemainingCooldownSeconds(updated, 'task1', 'team1') > 0);
```

**Expected Result**: ✅ Cooldown applied and tracked

---

### Test 1.3: Danger Zone Detection ✅
**File**: `utils/eliminationLogic.ts`
**Function**: `isInDangerZone()`

**Setup**:
```javascript
const bombLocation = { lat: 55.676, lng: 12.568 };
const teamLocation = { lat: 55.676, lng: 12.569 }; // ~100 meters away
const otherLocation = { lat: 55.68, lng: 12.568 }; // ~5+ km away
```

**Test**:
```javascript
assert(isInDangerZone(teamLocation, bombLocation, 30) === false);
assert(isInDangerZone(otherLocation, bombLocation, 30) === false);

// Test with very close location
const closeLocation = { lat: 55.6761, lng: 12.5681 }; // ~12 meters
assert(isInDangerZone(closeLocation, bombLocation, 30) === true);
```

**Expected Result**: ✅ Distance calculation accurate

---

### Test 1.4: Leaderboard Calculations ✅
**File**: `utils/eliminationLogic.ts`
**Function**: `getEliminationLeaderboard()`

**Setup**:
```javascript
const game = {
  points: [{}, {}, {}], // 3 tasks
  capturedTasks: { 'task1': 'team1', 'task2': 'team1', 'task3': 'team2' },
  teamCaptureCount: { 'team1': 2, 'team2': 1 }
};
const teams = [
  { id: 'team1', name: 'Team A' },
  { id: 'team2', name: 'Team B' }
];
```

**Test**:
```javascript
const leaderboard = getEliminationLeaderboard(game, teams);
assert(leaderboard[0].team.id === 'team1'); // First place
assert(leaderboard[0].captureCount === 2);
assert(leaderboard[1].team.id === 'team2'); // Second place
assert(leaderboard[1].captureCount === 1);
```

**Expected Result**: ✅ Rankings correct

---

## Component Tests

### Test 2.1: EliminationGameMode Rendering
**File**: `components/EliminationGameMode.tsx`

**Steps**:
1. Mount component with test game and teams
2. Verify GameMap renders
3. Verify team colors display correctly
4. Verify leaderboard shows all teams
5. Verify bomb button appears (3 remaining)

**Expected Result**: ✅ Component renders without errors

---

### Test 2.2: CooldownTimer Visual
**File**: `components/CooldownTimer.tsx`

**Steps**:
1. Mount with remainingSeconds = 120
2. Verify timer displays "2:00"
3. Wait 5 seconds
4. Verify timer updates to "1:55"
5. Verify progress bar decreases
6. Verify "remaining" text visible

**Expected Result**: ✅ Timer updates correctly, visual feedback clear

---

### Test 2.3: BombPlacementModal Flow
**File**: `components/BombPlacementModal.tsx`

**Steps**:
1. Open modal
2. Verify 3 duration options visible
3. Click 30s bomb option
4. Verify selection highlighted
5. Click "Place Bomb" button
6. Verify modal closes
7. Verify onPlaceBomb callback called

**Expected Result**: ✅ Modal flow works, callback triggered

---

### Test 2.4: EliminationLeaderboard Sorting
**File**: `components/EliminationLeaderboard.tsx`

**Steps**:
1. Mount with unordered teams
2. Verify teams sorted by capture count (descending)
3. Verify gold/silver/bronze medals shown for top 3
4. Verify progress bars display correctly
5. Verify user's team highlighted in orange

**Expected Result**: ✅ Sorting correct, UI clear

---

### Test 2.5: CapturedTasksPlayground Display
**File**: `components/CapturedTasksPlayground.tsx`

**Steps**:
1. Mount with game (5 tasks total, 3 captured)
2. Verify summary shows "3/5"
3. Verify tasks grouped by capturing team
4. Verify capture order numbered (1, 2, 3)
5. Verify task titles and locations shown
6. Verify remaining tasks list at bottom

**Expected Result**: ✅ All captured tasks displayed correctly

---

## Integration Tests

### Test 3.1: Task Capture Flow
**Devices**: 2 mobile devices
**Duration**: 10 minutes

**Steps**:
1. Both teams see game on map
2. Team A navigates to Task 1
3. Team A solves Task 1 correctly
4. **VERIFY**: 
   - ✅ Task 1 disappears from Team B's map
   - ✅ Task 1 appears in Team A's captured tasks
   - ✅ Leaderboard shows Team A: 1
5. Team B navigates to Task 2
6. Team B solves Task 2 correctly
7. **VERIFY**:
   - ✅ Task 2 disappears from Team A's map
   - ✅ Leaderboard shows Team A: 1, Team B: 1

**Expected Result**: ✅ Cross-device synchronization working

---

### Test 3.2: Cooldown Enforcement
**Devices**: 2 mobile devices
**Duration**: 5 minutes

**Steps**:
1. Team A navigates to Task 1
2. Team A enters WRONG answer
3. **VERIFY**:
   - ✅ Cooldown timer appears (2:00)
   - ✅ Task locked for retry
4. Team A attempts to answer again immediately
5. **VERIFY**:
   - ✅ System prevents re-answer (locked state)
   - ✅ Error message shown
6. Team A can answer OTHER tasks
7. **VERIFY**:
   - ✅ Task 2 answerable
   - ✅ Task 1 still locked
8. Wait 2 minutes (or simulate in dev tools)
9. **VERIFY**:
   - ✅ Timer expires
   - ✅ Task 1 becomes unlocked
   - ✅ Retry possible

**Expected Result**: ✅ Cooldown enforced correctly

---

### Test 3.3: Bomb Placement & Danger Zone
**Devices**: 2 mobile devices
**Duration**: 10 minutes

**Setup**: Teams at different locations (500m+ apart)

**Steps**:
1. Team A at location (55.676, 12.568)
2. Team A opens bomb menu
3. Team A selects 30-second bomb
4. **VERIFY**:
   - ✅ "Current Location" shows correct coordinates
   - ✅ "Bombs Remaining" shows 2/3
   - ✅ Modal shows placement option
5. Team A confirms bomb placement
6. **VERIFY**:
   - ✅ Modal closes
   - ✅ Bomb counter shows 2/3
   - ✅ Red circle (30m radius) appears on map
   - ✅ Team B sees bomb on their map
7. Wait 30 seconds for detonation
8. **VERIFY**:
   - ✅ Bomb disappears from map
   - ✅ If Team B was inside 30m radius: -300 points shown
   - ✅ Countdown timer reached zero

**Expected Result**: ✅ Bomb mechanics working, danger zones visible

---

### Test 3.4: Real-Time Synchronization
**Devices**: 2 mobile devices
**Duration**: 5 minutes

**Steps**:
1. Open game on both devices
2. Team A moves to new location
3. **VERIFY** (on Team B's device):
   - ✅ Team A's position updates within 1-2 seconds
   - ✅ Team A's color remains consistent
4. Team A captures a task
5. **VERIFY** (on Team B's device):
   - ✅ Task disappears from map instantly
   - ✅ Leaderboard updates immediately
   - ✅ Captured tasks view updates
6. Team B places bomb
7. **VERIFY** (on Team A's device):
   - ✅ Bomb appears on map immediately
   - ✅ Danger zone visible
   - ✅ Countdown starts

**Expected Result**: ✅ Real-time sync < 2 seconds

---

### Test 3.5: Multi-Team Competition (4 Teams)
**Devices**: 4 mobile devices
**Duration**: 30 minutes

**Setup**:
- Game with 4 teams
- 5 tasks at different locations
- Teams dispersed geographically

**Steps**:
1. All teams start game, see all 5 tasks
2. Each team navigates to different tasks
3. Teams solve tasks in various order:
   - Team A: Task 1 (correct), Task 2 (wrong)
   - Team B: Task 3 (correct)
   - Team C: Task 1 (correct, after A captured)
   - Team D: Task 2 (correct after cooldown)
4. **VERIFY ALL**:
   - ✅ Tasks disappear correctly for non-capturing teams
   - ✅ Leaderboard shows correct ranking
   - ✅ Each team's color consistent
   - ✅ Cooldown blocks re-attempts
   - ✅ All captured tasks shown in playground

**Expected Result**: ✅ Complex multi-team scenario works perfectly

---

### Test 3.6: Bomb During Active Game
**Devices**: 2 mobile devices
**Duration**: 10 minutes

**Setup**: Teams have captured 2 tasks each

**Steps**:
1. Team A at location X with GPS coordinate
2. Team B at location Y (300m away)
3. Team A places 120-second bomb at location X
4. **VERIFY**:
   - ✅ 30m danger zone appears on both maps
   - ✅ Red circle centered at location X
5. Team B moves toward location X
6. **VERIFY**:
   - ✅ As Team B approaches, UI indicates "Entering danger zone"
   - ✅ Distance to center updates
7. Bomb countdown reaches 0
8. **VERIFY**:
   - ✅ If Team B inside 30m: "DANGER ZONE! -300 points"
   - ✅ If Team B outside 30m: No penalty
   - ✅ Bomb disappears from map
   - ✅ Danger zone visual cleared

**Expected Result**: ✅ Bomb proximity detection accurate

---

## End-to-End Game Test

### Test 4.1: Complete Game Session
**Devices**: 3 mobile devices (3 teams)
**Duration**: 45 minutes
**Setup**: 5 tasks, 3 teams, all systems active

**Hour 0:00 - Game Start**
- [ ] All teams see game on map
- [ ] Teams see 5 uncaptured tasks
- [ ] Team colors visible and distinct
- [ ] All team positions shown
- [ ] Leaderboard shows 0 captures for all

**Hour 0:10 - First Captures**
- [ ] Team A captures Task 1 → Leaderboard: A=1
- [ ] Task 1 disappears from B, C
- [ ] Team B captures Task 2 → Leaderboard: A=1, B=1
- [ ] Team C captures Task 3 → Leaderboard: A=1, B=1, C=1

**Hour 0:20 - Wrong Answer & Cooldown**
- [ ] Team A attempts Task 4 with WRONG answer
- [ ] Cooldown timer starts (2:00)
- [ ] Team A cannot retry Task 4 immediately
- [ ] Team B captures Task 4 → B=2
- [ ] Team A can attempt Task 5 (not on cooldown)
- [ ] Team A succeeds on Task 5 → A=2

**Hour 0:30 - Bomb Placement**
- [ ] Team A places 60-second bomb
- [ ] Danger zone visible on all maps
- [ ] Team C in bomb radius at detonation
- [ ] Team C loses 300 points (indicated)
- [ ] Bomb counter shows A: 2/3 remaining

**Hour 0:40 - Final Pushes**
- [ ] Team A's cooldown expires, retries Task 4 successfully → A=3
- [ ] Team C recovers and captures Task 5 → C=2
- [ ] Team B places bomb strategically
- [ ] Final standings: A=3, B=2, C=2

**Hour 0:45 - Game End**
- [ ] All 5 tasks captured
- [ ] Game transitions to "ended" state
- [ ] Final leaderboard frozen (A wins with 3)
- [ ] CapturedTasksPlayground shows all captures
- [ ] Results persist for review

**Expected Result**: ✅ Complete game flow works seamlessly

---

## Performance Tests

### Test 5.1: Map Performance with Many Teams
**Test**: Render map with 10 teams, 20 tasks, 15 danger zones

**Verify**:
- [ ] No lag on map interaction
- [ ] Smooth zoom/pan operations
- [ ] Team markers render instantly
- [ ] Danger zones visible without flicker
- [ ] FPS remains > 30

**Expected Result**: ✅ Smooth 60 FPS performance

---

### Test 5.2: Real-Time Update Latency
**Test**: Capture a task and measure time to display on other device

**Target**: < 2 seconds

**Measure**:
- [ ] Time for task to disappear: _____ seconds
- [ ] Time for leaderboard update: _____ seconds
- [ ] Time for captured task to appear: _____ seconds

**Expected Result**: ✅ All updates < 2 seconds

---

### Test 5.3: Battery Impact
**Test**: Run game for 30 minutes with GPS enabled

**Measure**:
- [ ] Battery drain: _____ % over 30 minutes
- [ ] Data usage: _____ MB
- [ ] Device temperature: Normal/Warm/Hot

**Expected Result**: ✅ Reasonable battery drain (< 10% per 30 min)

---

## Stress Tests

### Test 6.1: Rapid Task Captures
**Test**: Multiple teams capturing tasks simultaneously

**Setup**: 
- 4 teams
- Automated task solving in rapid succession
- Network latency simulated

**Verify**:
- [ ] No data conflicts
- [ ] Leaderboard stays accurate
- [ ] Tasks properly distributed
- [ ] No double-captures

**Expected Result**: ✅ System handles concurrent operations

---

### Test 6.2: Network Disconnection
**Test**: Simulate network loss during game

**Steps**:
1. Enable airplane mode during active game
2. Attempt to capture task (should queue)
3. Disable airplane mode
4. **Verify** sync occurs when reconnected

**Expected Result**: ✅ Graceful handling, recovery on reconnect

---

## Regression Tests

### Test 7.1: Standard Game Mode Still Works
**Verify** that ELIMINATION doesn't break STANDARD mode:
- [ ] Standard game creates successfully
- [ ] GPS-based tasks work
- [ ] Points system intact
- [ ] No task elimination
- [ ] Original gameplay preserved

**Expected Result**: ✅ No regression in standard mode

---

### Test 7.2: Playzone Mode Still Works
**Verify** ELIMINATION doesn't interfere with PLAYZONE mode:
- [ ] Playzone game creates successfully
- [ ] Indoor touch-based gameplay works
- [ ] No GPS interference
- [ ] Playground navigation intact

**Expected Result**: ✅ No regression in playzone mode

---

## Bug Reports Template

**When you find a bug, create an issue with this template:**

```
## Bug Report

**Title**: [Concise description]

**Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low

**Device**: 
- Model: ___________
- OS: ___________
- App Version: ___________

**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected Result**: 
What should happen?

**Actual Result**: 
What actually happened?

**Evidence**:
[Screenshots, logs, or videos]

**Environment**:
- Game Mode: ELIMINATION
- Number of Teams: ___
- Number of Tasks: ___
- Network: WiFi / 4G / 5G
```

---

## Test Results Checklist

**Date**: _____________
**Tester**: _____________
**Environment**: Development / Staging / Production

### Unit Tests
- [ ] All 4 utility functions pass
- [ ] No console errors
- [ ] Logic calculations verified

### Component Tests
- [ ] All 5 components render
- [ ] No React warnings
- [ ] Event handlers work
- [ ] Responsive on mobile

### Integration Tests
- [ ] Task capture works
- [ ] Cooldown enforced
- [ ] Bombs functional
- [ ] Real-time sync < 2s
- [ ] Multi-team works
- [ ] Game flow complete

### Performance Tests
- [ ] FPS > 30
- [ ] Latency < 2s
- [ ] Battery acceptable

### Overall Status
- [ ] PASS ✅
- [ ] PASS WITH NOTES ⚠️
- [ ] FAIL ❌

### Notes
___________________________________________
___________________________________________

**Sign-off**: _____________

---

**Document Version**: 1.0  
**Status**: 🟢 READY FOR TESTING  
**Last Updated**: December 2025

