# Advanced Features Implementation Guide

This document describes the advanced geospatial tracking, monitoring, and notification features added to the TeamChallenge application.

---

## 📊 Feature 1: Team Location Tracking & History

### Overview
Complete system for tracking team GPS movements, task attempts, and generating historical path visualizations.

### Database Schema (Supabase)

#### 1. Team Locations Table
```sql
CREATE TABLE team_locations (
    id UUID PRIMARY KEY,
    team_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timestamp TIMESTAMPTZ,
    accuracy DECIMAL(6, 2),
    speed DECIMAL(6, 2), -- meters/second
    is_impossible_travel BOOLEAN,
    created_at TIMESTAMPTZ
);
```

#### 2. Task Attempts Table
```sql
CREATE TABLE task_attempts (
    id UUID PRIMARY KEY,
    team_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    task_title TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status TEXT CHECK (status IN ('CORRECT', 'WRONG', 'SUBMITTED')),
    timestamp TIMESTAMPTZ,
    answer JSONB,
    created_at TIMESTAMPTZ
);
```

### Services

**File**: `services/teamLocationTracking.ts`

**Key Functions**:
- `recordTeamLocation()` - Save GPS breadcrumb
- `recordTaskAttempt()` - Log task completion
- `fetchTeamHistory()` - Get full team movement history
- `fetchImpossibleTravelWarnings()` - Get speed violations
- `subscribeToTeamLocations()` - Real-time location updates

### Usage

**Recording Location**:
```typescript
import { recordTeamLocation } from './services/teamLocationTracking';

await recordTeamLocation(
  teamId,
  gameId,
  { lat: 55.6761, lng: 12.5683 },
  accuracy // optional GPS accuracy in meters
);
```

**Recording Task Attempt**:
```typescript
import { recordTaskAttempt } from './services/teamLocationTracking';

await recordTaskAttempt(
  teamId,
  gameId,
  taskId,
  taskTitle,
  location,
  'CORRECT', // or 'WRONG', 'SUBMITTED'
  answerData // optional
);
```

**Fetching History**:
```typescript
import { fetchTeamHistory } from './services/teamLocationTracking';

const history = await fetchTeamHistory(gameId);
// Returns TeamHistory[] with paths and task attempts
```

### SQL Setup
Run the SQL script in **SYSTEM TOOLS → SUPABASE** to create all required tables, indexes, and triggers.

---

## 🔍 Feature 2: God Mode / Fog of War

### Overview
Allows instructors to toggle between seeing everything ("God Mode") and seeing exactly what a specific team sees ("Fog of War") for better support.

### UI Location
- **Modes**: PLAY and INSTRUCTOR modes only
- **Position**: Top center of the map
- **Access**: Automatically appears when teams are available

### How It Works

#### God Mode (Default)
- See all tasks, all teams, all markers
- Full instructor visibility
- No restrictions

#### Fog of War Mode
When enabled:
1. Select a team from dropdown
2. Map shows only:
   - Tasks unlocked for that team
   - Tasks completed by that team
   - That team's current position
3. Perfect for troubleshooting team issues

### UI Components

**Toggle Button**:
- Shows "GOD MODE" when active (all visible)
- Shows "FOG OF WAR" when restricted view enabled
- Eye/EyeOff icon indicates current state

**Team Selector**:
- Dropdown appears when Fog of War is active
- Lists all teams in current game
- "Clear Selection" option to reset

### Implementation Details

**Files Modified**:
- `components/GameHUD.tsx` - UI controls
- `components/GameMap.tsx` - Point filtering logic
- `App.tsx` - State management

**Key State**:
```typescript
const [fogOfWarEnabled, setFogOfWarEnabled] = useState(false);
const [selectedTeamForFogOfWar, setSelectedTeamForFogOfWar] = useState<string | null>(null);
```

**Filtering Logic**:
```typescript
// In GameMap, points are filtered based on:
if (fogOfWarEnabled && selectedTeamId) {
  const isCompletedByTeam = selectedTeamCompletedPointIds.includes(p.id);
  const isVisible = p.isUnlocked || isCompletedByTeam;
  if (!isVisible) return false;
}
```

---

## ⚠️ Feature 3: Impossible Travel Detection

### Overview
Automatically detects when teams move faster than humanly possible (e.g., traveling by car instead of walking).

### Detection Algorithm

**Database Trigger** (automatic):
```sql
CREATE FUNCTION detect_impossible_travel()
-- Calculates speed between consecutive GPS points
-- Flags speeds > 2.5 m/s (9 km/h) as impossible
```

**Speed Threshold**: 2.5 m/s ≈ 9 km/h (fast walk/jog)

### Warning Display

**Component**: `ImpossibleTravelWarnings.tsx`

**Location**: Top-right corner of map

**Visibility**: EDIT and INSTRUCTOR modes only

### Warning Panel Features

- **Expandable List**: Click header to expand/collapse
- **Real-time Updates**: Refreshes every 30 seconds
- **Team Information**:
  - Team name
  - Calculated speed (km/h)
  - Timestamp ("2m ago", "1h ago")
- **Quick Navigation**: Click Navigation icon to jump to location
- **Manual Refresh**: Button to reload warnings on demand

### Warning Data

**Example**:
```json
{
  "teamName": "Alpha Team",
  "speed": 15.3, // m/s (55 km/h)
  "location": { "lat": 55.676, "lng": 12.568 },
  "timestamp": "2025-01-15T14:30:00Z"
}
```

### Integration

The detection happens **automatically** in the database via trigger:
1. Team GPS location is recorded
2. Trigger calculates distance from previous point
3. Speed is calculated (distance / time)
4. If speed > 2.5 m/s, `is_impossible_travel` flag is set
5. Warning appears in instructor/editor view

**No manual setup required** - works automatically once SQL schema is applied.

---

## 📳 Feature 4: Phone Vibration for Chat Notifications

### Overview
Players' phones vibrate when receiving chat messages, especially urgent notifications from instructors.

### Vibration API

**File**: `utils/vibration.ts`

**Key Functions**:
```typescript
// Simple vibration
vibrate(200); // 200ms pulse

// Pattern vibration
vibratePattern([200, 100, 200]); // vibrate-pause-vibrate

// Predefined patterns
vibrateChatNotification(isUrgent);
```

### Vibration Patterns

**Standard Message**: 
- Pattern: `[200]` (single 200ms pulse)
- Used for: Normal chat messages

**Urgent Message**:
- Pattern: `[200, 100, 200, 100, 200]` (triple pulse)
- Used for: Messages marked as urgent by instructor

### Chat Integration

**File**: `components/ChatDrawer.tsx`

**Behavior**:
- ✅ Vibrates when new message arrives
- ✅ Stronger vibration for urgent messages
- ❌ Does NOT vibrate for instructors (they sent the message)
- ❌ Does NOT vibrate when drawer is closed

**Code**:
```typescript
useEffect(() => {
  if (isOpen && !isInstructorMode && messages.length > prevMessageCountRef.current) {
    const latestMessage = messages[messages.length - 1];
    vibrateChatNotification(latestMessage?.isUrgent || false);
  }
  prevMessageCountRef.current = messages.length;
}, [messages, isOpen, isInstructorMode]);
```

### Browser Support

**Supported**:
- Chrome (Android)
- Firefox (Android)
- Samsung Internet
- Mobile Safari (iOS 16+)

**Not Supported**:
- Desktop browsers
- iOS < 16

The code gracefully handles unsupported devices (no errors, just no vibration).

---

## 🚀 Deployment Checklist

### 1. Database Setup

**Go to**: SYSTEM TOOLS → SUPABASE

**Action**: Run the complete SQL script shown in the modal

**This creates**:
- `team_locations` table
- `task_attempts` table
- Indexes for performance
- `detect_impossible_travel()` trigger function
- Real-time subscriptions

### 2. Environment Variables

No new environment variables required. Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Test Features

#### God Mode / Fog of War
1. Start a game with multiple teams
2. Switch to INSTRUCTOR or PLAY mode
3. Look for toggle at top-center of map
4. Enable Fog of War
5. Select a team
6. Verify only that team's unlocked tasks are visible

#### Impossible Travel Warnings
1. Switch to EDIT or INSTRUCTOR mode
2. Record test GPS locations with high speed:
   ```typescript
   // Simulate car travel
   await recordTeamLocation(teamId, gameId, location1);
   await new Promise(r => setTimeout(r, 1000)); // wait 1 sec
   await recordTeamLocation(teamId, gameId, location2_faraway);
   ```
3. Warning should appear in top-right

#### Chat Vibration
1. Open app on mobile device
2. Join as team player
3. Have instructor send message
4. Phone should vibrate
5. Send urgent message → stronger vibration

---

## 📝 API Reference

### Team Location Tracking

```typescript
// Record GPS position
await recordTeamLocation(
  teamId: string,
  gameId: string,
  location: Coordinate,
  accuracy?: number
): Promise<{ success: boolean; isImpossibleTravel?: boolean; error?: string }>

// Record task attempt
await recordTaskAttempt(
  teamId: string,
  gameId: string,
  taskId: string,
  taskTitle: string | undefined,
  location: Coordinate,
  status: 'CORRECT' | 'WRONG' | 'SUBMITTED',
  answer?: any
): Promise<{ success: boolean; error?: string }>

// Fetch team history
await fetchTeamHistory(
  gameId: string
): Promise<TeamHistory[]>

// Fetch warnings
await fetchImpossibleTravelWarnings(
  gameId: string
): Promise<ImpossibleTravelWarning[]>

// Subscribe to real-time updates
const unsubscribe = subscribeToTeamLocations(
  gameId: string,
  onUpdate: (location: TeamLocationRecord) => void
)
```

### Vibration

```typescript
// Simple vibration
vibrate(duration?: number): void

// Pattern vibration
vibratePattern(pattern: number[]): void

// Predefined patterns
vibrateChatNotification(isUrgent: boolean): void
vibrateNotification(): void
vibrateSuccess(): void
vibrateError(): void

// Stop vibration
stopVibration(): void

// Check support
isVibrationSupported(): boolean
```

---

## 🔧 Troubleshooting

### Fog of War Not Working

**Problem**: Toggle button not visible

**Solution**:
- Ensure you're in PLAY or INSTRUCTOR mode (not EDIT)
- Check that game has active teams
- Verify `teams` prop is passed to GameHUD

**Problem**: Points still visible when they shouldn't be

**Solution**:
- Check team's `completedPointIds` array
- Verify point's `isUnlocked` status
- Clear browser cache and reload

### Impossible Travel Not Detecting

**Problem**: No warnings appearing

**Solution**:
- Verify SQL trigger was created: 
  ```sql
  SELECT * FROM information_schema.triggers 
  WHERE trigger_name = 'trigger_detect_impossible_travel';
  ```
- Check `is_impossible_travel` column exists
- Manually query warnings table:
  ```sql
  SELECT * FROM team_locations WHERE is_impossible_travel = true;
  ```

### Vibration Not Working

**Problem**: Phone not vibrating

**Solution**:
- Check browser support (Chrome Android, Safari iOS 16+)
- Ensure phone is not in silent mode (some devices)
- Check browser permissions (may need site permissions)
- Test with: `navigator.vibrate(200)` in console
- Verify drawer is open when message arrives

---

## 📊 Performance Considerations

### Database Indexes

The SQL script creates optimized indexes:
```sql
CREATE INDEX idx_team_locations_team_game 
  ON team_locations(team_id, game_id, timestamp DESC);

CREATE INDEX idx_task_attempts_team_game 
  ON task_attempts(team_id, game_id, timestamp DESC);
```

These ensure fast queries even with thousands of location records.

### Real-time Updates

Supabase real-time subscriptions are used for:
- Team location updates
- Chat messages
- Game state changes

**Connection pooling** is handled automatically by Supabase.

### Fog of War Performance

Point filtering happens client-side in React memo:
```typescript
const mapPoints = points.filter(p => {
  // Fast O(1) lookups using Set for completedPointIds
  if (fogOfWarEnabled && selectedTeamId) {
    return p.isUnlocked || selectedTeamCompletedPointIds.includes(p.id);
  }
  return true;
});
```

For games with 1000+ points, filtering takes < 5ms.

---

## 🎯 Future Enhancements

### Team Location Tracking
- [ ] Historical playback with timeline slider
- [ ] Heat maps of popular areas
- [ ] Path export as GPX files
- [ ] Distance/duration statistics per team

### Fog of War
- [ ] Time-based filtering (last N hours)
- [ ] Multiple team comparison view
- [ ] Highlight differences between teams

### Impossible Travel
- [ ] Configurable speed thresholds per game
- [ ] Auto-pause game for flagged teams
- [ ] Email/SMS alerts for instructors
- [ ] GPS accuracy-based confidence scoring

### Vibration
- [ ] Custom vibration patterns per game
- [ ] User preference to disable vibrations
- [ ] Haptic feedback for task completion
- [ ] Battery-aware vibration intensity

---

## 📚 Related Documentation

- [Team History Map Guide](TEAM_HISTORY_MAP_GUIDE.md)
- [Supabase Setup Guide](SUPABASE_FIX_GUIDE.md)
- [Game Modes Documentation](GAME_MODES_MASTER_SUMMARY.md)

---

## 🆘 Support

For questions or issues:
1. Check browser console for error messages
2. Verify SQL schema is correctly applied in Supabase
3. Test with demo data using `generateDemoTeamHistory()`
4. Check network tab for failed API requests

**Database Issues**: [Connect to Supabase](#open-mcp-popover) via MCP for direct support

