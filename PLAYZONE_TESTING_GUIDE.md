# 🧪 PLAYZONE GAME FEATURE - COMPREHENSIVE TESTING GUIDE

**Testing Date**: December 2025  
**Test Environment**: Development + Staging  
**Target Devices**: Desktop, Tablet, Mobile  
**Duration**: 2-3 hours

---

## 📋 PRE-TESTING CHECKLIST

### Environment Setup
- [ ] Development server running (`npm run dev`)
- [ ] Test database configured
- [ ] Mock data loaded (sample games, tasks, playgrounds)
- [ ] Network connectivity verified
- [ ] Browser console open for error monitoring
- [ ] Test devices prepared (mobile, tablet, desktop)

### Test Data Preparation
```javascript
// Sample Playzone Game to Create
{
  name: 'INDOOR ADVENTURE TEST',
  gameMode: 'playzone',
  description: 'Test playzone game with multiple activations',
  language: 'English',
  playgrounds: [
    { id: 'pg-1', title: 'Main Hall', iconId: 'star' },
    { id: 'pg-2', title: 'Meeting Room', iconId: 'users' }
  ],
  points: [
    { title: 'Task 1', activationTypes: ['qr'], qrCodeString: 'TEST_QR_001' },
    { title: 'Task 2', activationTypes: ['click'], activationTypes: ['nfc'], nfcTagId: 'NFC_TEST_001' },
    { title: 'Task 3', activationTypes: ['ibeacon', 'qr'] }
  ]
}
```

---

## 🎮 TEST SCENARIOS

### TEST SUITE 1: Game Creation (15 minutes)

#### Test 1.1: Create Playzone Game
**Steps**:
1. Open landing page
2. Click "CREATE" menu
3. Select "PLAYZONE GAME" button
4. Verify mode selection screen appears with radio buttons
5. Select "PLAYZONE GAME" option
6. Fill in game details:
   - Name: "TEST PLAYZONE 001"
   - Description: "Testing playzone mode"
   - Language: English
7. Click "CREATE GAME"
8. Verify game is created with `gameMode: 'playzone'`

**Expected Result**: ✅ Game created with playzone mode  
**Pass Criteria**:
- [ ] Game created successfully
- [ ] gameMode set to 'playzone'
- [ ] No GPS settings option shown
- [ ] Game appears in games list

---

#### Test 1.2: Create Standard Game (Control Test)
**Steps**:
1. Repeat Test 1.1 but select "STANDARD GAME" mode
2. Verify map style options ARE shown

**Expected Result**: ✅ Standard game with all options  
**Pass Criteria**:
- [ ] Map style selection available
- [ ] GPS options visible
- [ ] Different from playzone game

---

#### Test 1.3: Add Playgrounds to Playzone Game
**Steps**:
1. Open playzone game in editor
2. Go to "ZONES" tab
3. Click "ADD ZONE"
4. Enter playground details:
   - Title: "Training Room"
   - Icon: Select any icon
   - Background: Upload or select
5. Save playground
6. Verify it appears in playgrounds list

**Expected Result**: ✅ Playground added successfully  
**Pass Criteria**:
- [ ] Playground appears in list
- [ ] Can add multiple playgrounds
- [ ] Playground data persists

---

### TEST SUITE 2: Task Management (20 minutes)

#### Test 2.1: Add QR Activation Task to Playzone Game
**Steps**:
1. Open playzone game editor
2. Go to "TASKS" tab
3. Create new task with:
   - Title: "QR Test Task"
   - Question: "Scan the QR code"
   - Activation: Enable "QR Code"
   - QR Code String: "TEST_QR_001"
4. Verify GPS section is HIDDEN
5. Save task

**Expected Result**: ✅ Task created without GPS option  
**Pass Criteria**:
- [ ] GPS activation section not visible
- [ ] QR activation works
- [ ] Task saved with QR activation
- [ ] Warning shown: "PLAYZONE MODE"

---

#### Test 2.2: Attempt to Add GPS Task (Negative Test)
**Steps**:
1. Open standard game
2. Create task with GPS activation
3. Switch to playzone game
4. Edit task
5. Verify GPS section is hidden

**Expected Result**: ✅ GPS hidden, cannot be enabled  
**Pass Criteria**:
- [ ] GPS section hidden
- [ ] Cannot enable GPS
- [ ] Clear messaging about limitations

---

#### Test 2.3: Mixed Activation Task
**Steps**:
1. Create task with multiple activations:
   - QR Code: enabled
   - NFC: enabled
   - Click: enabled
2. Save task
3. Verify all three activations present

**Expected Result**: ✅ Mixed activations work  
**Pass Criteria**:
- [ ] All non-GPS methods work
- [ ] Task accepts multiple activations
- [ ] Persists correctly

---

### TEST SUITE 3: Team Entry System (20 minutes)

#### Test 3.1: Join Playzone Game with Team Name
**Steps**:
1. Start playzone game
2. Go to "PLAY" mode
3. Select playzone game
4. Verify PlayzoneGameEntry modal appears
5. Click "ENTER TEAM NAME"
6. Type team name: "RED TEAM"
7. Click "JOIN GAME"
8. Verify game starts with team name

**Expected Result**: ✅ Game starts with team  
**Pass Criteria**:
- [ ] PlayzoneGameEntry modal shown
- [ ] Text input accepts team name
- [ ] Team name applied to game
- [ ] Game starts immediately
- [ ] No team lobby shown

---

#### Test 3.2: Join with QR Code Scan
**Steps**:
1. Start playzone game
2. Click "SCAN QR CODE"
3. Use device camera to scan:
   - For testing: Use your phone to generate QR with text "BLUE_TEAM"
   - Or manually paste: "BLUE_TEAM"
4. Verify QR code detected and entered
5. Click "JOIN GAME"
6. Verify game starts

**Expected Result**: ✅ QR scanning works  
**Pass Criteria**:
- [ ] Camera access requested
- [ ] Video feed shows in modal
- [ ] QR code recognized automatically
- [ ] Team joins on detection
- [ ] Fallback to text input works

---

#### Test 3.3: Camera Permission Denied (Fallback)
**Steps**:
1. Click "SCAN QR CODE"
2. Deny camera permission at browser prompt
3. Verify text input shown instead
4. Type team name and submit

**Expected Result**: ✅ Fallback to text input  
**Pass Criteria**:
- [ ] Error message shown
- [ ] Text input available
- [ ] Can still join game
- [ ] No crashes

---

### TEST SUITE 4: Game UI & Features (20 minutes)

#### Test 4.1: Map is Hidden for Playzone Game
**Steps**:
1. Start playzone game in EDIT mode
2. Verify main game view
3. Look for map in background
4. Switch to standard game
5. Verify map IS visible there

**Expected Result**: ✅ Map hidden only for playzone  
**Pass Criteria**:
- [ ] No map in playzone game
- [ ] Map visible in standard game
- [ ] UI not broken without map
- [ ] All other features work

---

#### Test 4.2: Countdown Timer Visible
**Steps**:
1. Configure playzone game with countdown timer (5 minutes)
2. Start game
3. Verify countdown timer visible at top of screen
4. Watch timer count down
5. Verify it updates every second

**Expected Result**: ✅ Timer always visible  
**Pass Criteria**:
- [ ] Timer shows at game start
- [ ] Counts down correctly
- [ ] Visible even during task completion
- [ ] Survives playground switches

---

#### Test 4.3: Playground Navigation
**Steps**:
1. Setup playzone game with 2+ playgrounds
2. Add tasks to each playground
3. Start game
4. Complete first playground's tasks
5. Use if/then logic to go to next playground
6. Verify new playground displays
7. Verify tasks for that playground shown

**Expected Result**: ✅ Smooth playground switching  
**Pass Criteria**:
- [ ] Can switch between playgrounds
- [ ] Tasks update per playground
- [ ] Timer persists across switches
- [ ] No data loss on switch

---

#### Test 4.4: Task Completion Features
**Steps**:
1. Start playzone game
2. Complete a QR-activated task by:
   - Scanning QR code or entering manually
   - Answering question
   - Receiving feedback
3. Verify all game features work:
   - [ ] Hints available
   - [ ] Feedback shown
   - [ ] Score updated
   - [ ] Timer continues

**Expected Result**: ✅ All features functional  
**Pass Criteria**:
- [ ] Task marks complete
- [ ] Score increases
- [ ] Next task available
- [ ] No crashes

---

### TEST SUITE 5: Validation & Edge Cases (15 minutes)

#### Test 5.1: Create Playzone Game Without Playgrounds (Warning)
**Steps**:
1. Create playzone game
2. Save without adding playgrounds
3. Check browser console
4. Verify warning logged

**Expected Result**: ✅ Warning logged  
**Pass Criteria**:
- [ ] Console shows warning
- [ ] Game still saves (graceful degradation)
- [ ] Clear message to user

---

#### Test 5.2: GPS-Only Task Filtering
**Steps**:
1. Create standard game with GPS-only task
2. Convert to playzone (or create as playzone)
3. Edit game
4. Verify GPS task not available for playzone

**Expected Result**: ✅ GPS tasks filtered  
**Pass Criteria**:
- [ ] GPS tasks hidden from selection
- [ ] Cannot enable GPS in editor
- [ ] Game saves without GPS activation

---

#### Test 5.3: Invalid QR Code
**Steps**:
1. Join playzone game with QR
2. Manually type invalid/empty QR code
3. Try to join

**Expected Result**: ✅ Validation prevents join  
**Pass Criteria**:
- [ ] Error message shown
- [ ] Button disabled if empty
- [ ] Can retry with valid code

---

#### Test 5.4: Empty Team Name
**Steps**:
1. Click "ENTER TEAM NAME"
2. Try to submit without entering name
3. Verify button disabled or error shown

**Expected Result**: ✅ Validation prevents empty entry  
**Pass Criteria**:
- [ ] Button disabled or error message
- [ ] Clear feedback to user
- [ ] Can enter valid name and try again

---

### TEST SUITE 6: Mobile Testing (15 minutes)

#### Test 6.1: Responsive Design on Mobile
**Steps**:
1. Open playzone game on mobile device (375px width)
2. Test landing page menu
3. Test game creation flow
4. Test team entry screen
5. Test gameplay

**Expected Result**: ✅ Works on mobile  
**Pass Criteria**:
- [ ] All UI elements visible
- [ ] Touch targets appropriately sized (44px+)
- [ ] No horizontal scroll needed
- [ ] Text readable
- [ ] Buttons clickable

---

#### Test 6.2: QR Scanning on Mobile
**Steps**:
1. Open playzone game on mobile
2. Click "SCAN QR CODE"
3. Verify rear camera used (not front)
4. Hold up QR code to camera
5. Verify quick detection and auto-submit

**Expected Result**: ✅ Smooth mobile scanning  
**Pass Criteria**:
- [ ] Camera opens reliably
- [ ] Rear camera used
- [ ] Auto-detects QR code
- [ ] No freezing or lag
- [ ] Can fallback to text input

---

#### Test 6.3: Gameplay on Mobile
**Steps**:
1. Join game on mobile
2. Complete tasks
3. Navigate playgrounds
4. Watch timer
5. Use touch interactions

**Expected Result**: ✅ Full gameplay works  
**Pass Criteria**:
- [ ] All touch interactions work
- [ ] No lag during gameplay
- [ ] Portrait orientation supported
- [ ] Can play full game successfully

---

## ✅ TEST RESULTS SUMMARY

### Test Suite Results
| Suite | Tests | Passed | Failed | Notes |
|-------|-------|--------|--------|-------|
| Game Creation | 3 | [ ] | [ ] | Required for foundation |
| Task Management | 3 | [ ] | [ ] | Core playzone feature |
| Team Entry | 3 | [ ] | [ ] | Critical UX flow |
| Game UI & Features | 4 | [ ] | [ ] | Main gameplay |
| Validation & Edge Cases | 4 | [ ] | [ ] | Robustness |
| Mobile Testing | 3 | [ ] | [ ] | Market requirement |
| **TOTAL** | **20** | **[ ]** | **[ ]** | **Target: 100%** |

---

## 🐛 BUG REPORTING TEMPLATE

### If You Find a Bug:

**Title**: [Feature] Brief description  
**Severity**: Critical/High/Medium/Low  
**Device**: Desktop/Mobile/Tablet  
**Browser**: Chrome/Safari/Firefox/Edge  
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: What should happen  
**Actual Result**: What actually happened  
**Screenshots/Video**: Attach if possible  
**Console Errors**: Paste any JS errors  

---

## 🎯 TESTING SIGN-OFF

### When All Tests Pass:

- [ ] 100% of test cases passed
- [ ] No critical bugs found
- [ ] No unresolved warnings
- [ ] Mobile testing successful
- [ ] Performance acceptable
- [ ] Ready for production

### Sign-Off:
**Tester Name**: _______________  
**Date**: _______________  
**Approval**: ✅ APPROVED FOR PRODUCTION

---

## 📊 TESTING METRICS

### Success Criteria
- ✅ 100% of test cases pass
- ✅ 0 critical bugs
- ✅ 0 unresolved high-priority bugs
- ✅ Mobile compatibility confirmed
- ✅ Performance within targets
- ✅ Documentation complete

### Current Status
**Overall**: 🔄 IN PROGRESS  
**Completion**: 0% (Ready to start testing)  
**Issues Found**: 0  
**Issues Resolved**: 0  

---

## 📝 NOTES FOR TESTERS

1. **QR Code Generation**: Use https://www.qr-code-generator.com/ to create test QR codes
2. **Mobile Testing**: Use device or Chrome DevTools mobile emulation
3. **Clear Cache**: Between tests, clear browser cache to avoid false positives
4. **Document Everything**: Screenshot failures and console errors
5. **Think Like a User**: Try to break it, try unusual input combinations
6. **Performance Matters**: Note lag, freezing, or slow operations

---

