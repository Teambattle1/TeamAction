# CLIENT ZONE - Implementation Plan & Status

## 🎯 PROJECT OVERVIEW
Create a dedicated client-facing zone accessible via game-specific links, allowing clients to view game statistics, team performance, and media galleries with presentation capabilities.

---

## ✅ RUNTIME STATUS
- **Dev Server**: ✅ Running (No errors detected)
- **Build Status**: ✅ Healthy
- **Dependencies**: ✅ All installed

---

## 📋 FEATURE BREAKDOWN

### 1. **CLIENT LOBBY STRUCTURE** 🏠
**Status**: 🔴 Not Started

**Requirements**:
- Separate route/view accessible by `/client/:gameId`
- Game chooser for active/completed games (exclude planned)
- Copy-to-clipboard link functionality
- Modern UI with client logo and name from game description
- Pin-shaped buttons matching landing page design

**Components to Create**:
- `components/ClientLobby.tsx` - Main client lobby container
- `components/ClientGameChooser.tsx` - Game selection interface
- `components/ClientHeader.tsx` - Branded header with logo

**Implementation Steps**:
1. Create routing structure for `/client/:gameId`
2. Add "CLIENT" button to landing page under PLAY
3. Implement game selection dialog
4. Create link generator with copy functionality
5. Design modern lobby interface with branding

---

### 2. **RANKING VIEW** 🏆
**Status**: 🔴 Not Started

**Requirements**:
- Real-time leaderboard showing team rankings
- Score display
- Team names and member counts
- Auto-refresh functionality

**Component to Create**:
- `components/ClientRanking.tsx`

**Data Requirements**:
- Fetch teams for gameId
- Sort by score (descending)
- Real-time updates via Supabase subscriptions

---

### 3. **STATS VIEW** 📊
**Status**: 🔴 Not Started

**Requirements**:
- Task list with completion status
- Team access indicators per task
- Color-coded markers:
  - 🟢 Green: Correct answer
  - 🟡 Yellow: Incorrect answer
  - 🔵 Blue/Gray: Not answered (photo/video submissions)
- Task-by-task breakdown

**Component to Create**:
- `components/ClientStats.tsx`
- `components/TaskCompletionGrid.tsx`

**Data Requirements**:
- Fetch all tasks for game
- Fetch team completion data
- Track correct/incorrect answers
- Handle media submissions (pending/approved/rejected)

---

### 4. **PHOTO/VIDEO GALLERY** 🖼️
**Status**: 🔴 Not Started

**Requirements**:
**A. Gallery View**:
- Thumbnail grid of all game media
- Filter by task
- Filter by team
- Click to enlarge

**B. Presentation Mode**:
- Select multiple photos
- Fullscreen slideshow
- Navigation controls (prev/next)
- Auto-advance option

**C. Instructor Tools** (Editor/Instructor access):
- Reorder photos
- **Rotate/fix orientation** (EXIF-based auto-correction)
- Delete/hide photos

**Components to Create**:
- `components/ClientMediaGallery.tsx` - Main gallery view
- `components/MediaThumbnail.tsx` - Individual thumbnail
- `components/MediaFilter.tsx` - Filter controls
- `components/PresentationMode.tsx` - Fullscreen slideshow
- `components/MediaManager.tsx` - Instructor photo management

**Data Requirements**:
- Fetch media submissions for gameId
- Store metadata (task, team, orientation, order)
- Handle EXIF data for auto-rotation

---

## 🗄️ DATABASE SCHEMA UPDATES

### New/Updated Tables:

#### `media_submissions` (Already created)
```sql
- id (UUID)
- game_id (TEXT)
- team_id (TEXT)
- team_name (TEXT)
- point_id (TEXT)
- point_title (TEXT)
- media_url (TEXT)
- media_type ('photo' | 'video')
- submitted_at (BIGINT)
- status ('pending' | 'approved' | 'rejected')
- reviewed_by (TEXT)
- reviewed_at (BIGINT)
- review_comment (TEXT)
- orientation (INTEGER) - NEW: EXIF orientation (1-8)
- display_order (INTEGER) - NEW: Custom sort order
```

---

## 🎨 UI/UX DESIGN

### Color Scheme (Match existing branding):
- Primary: Orange (#f97316)
- Success: Green (#22c55e)
- Warning: Yellow (#eab308)
- Error: Red (#ef4444)
- Background: Dark slate (#0f172a, #1e293b)

### Pin-Shaped Buttons (as per image):
- CREATE pin: Red/Orange (#ef4444 → #f97316)
- EDIT pin: Blue (#3b82f6)
- PLAY pin: Teal (#14b8a6)
- **CLIENT pin**: Purple (#a855f7)

### Layout:
```
┌─────────────────────────────────────┐
│  CLIENT LOGO    |    GAME NAME     │
│                 |   Copy Link 🔗   │
├─────────────────────────────────────┤
│  [RANKING]  [STATS]  [GALLERY]     │
├─────────────────────────────────────┤
│                                     │
│         CONTENT AREA                │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔗 INTEGRATION POINTS

### Landing Page Integration:
1. Add "CLIENT" button next to PLAY
2. On click → Open ClientGameChooser
3. Select active/completed game → Generate link
4. Copy link or navigate directly

### Instructor Access:
- Access media manager from GameHUD tools
- Media rotation/reordering controls
- Approval workflow integration

---

## 📝 IMPLEMENTATION ORDER (Priority)

### Phase 1: Foundation ⭐ **CRITICAL**
1. ✅ Create routing structure
2. ✅ Add CLIENT button to landing page
3. ✅ Create ClientGameChooser component
4. ✅ Implement ClientLobby main container

### Phase 2: Core Features ⭐ **HIGH PRIORITY**
5. ⏳ Implement Ranking view
6. ⏳ Implement Stats view with color markers
7. ⏳ Create basic Media Gallery

### Phase 3: Advanced Features ⭐ **MEDIUM PRIORITY**
8. ⏳ Add filtering (task/team)
9. ⏳ Implement Presentation Mode
10. ⏳ Add EXIF orientation detection/correction

### Phase 4: Instructor Tools ⭐ **LOW PRIORITY**
11. ⏳ Media reordering
12. ⏳ Media rotation controls
13. ⏳ Integration with existing approval workflow

---

## 🛠️ TECHNICAL NOTES

### Image Orientation:
- Use `exif-js` library for EXIF data extraction
- Auto-rotate based on EXIF orientation tag (1-8)
- CSS transform for display: `transform: rotate(${angle}deg)`
- Store corrected orientation in database

### Real-time Updates:
- Use Supabase real-time subscriptions for:
  - Team scores (ranking)
  - Task completions (stats)
  - New media submissions (gallery)

### Link Generation:
```typescript
const clientLink = `${window.location.origin}/client/${gameId}`;
```

### Routing:
- Use React Router or custom routing
- Pattern: `/client/:gameId`
- Sub-routes: `/client/:gameId/ranking`, `/client/:gameId/stats`, `/client/:gameId/gallery`

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Client can access lobby via unique game link
- [ ] Ranking shows live team standings
- [ ] Stats shows all tasks with color-coded completion markers
- [ ] Gallery displays all game photos/videos
- [ ] Filters work for task and team
- [ ] Presentation mode plays selected media fullscreen
- [ ] Instructors can rotate and reorder media
- [ ] Images auto-correct orientation from EXIF data
- [ ] Link can be copied to clipboard
- [ ] Branded with client logo and game name

---

## 📦 FILES TO CREATE

```
components/
├── ClientLobby.tsx          (Main container)
├── ClientGameChooser.tsx    (Game selection)
├── ClientHeader.tsx         (Branded header)
├── ClientRanking.tsx        (Leaderboard)
├── ClientStats.tsx          (Task completion grid)
├── TaskCompletionGrid.tsx   (Individual task breakdown)
├── ClientMediaGallery.tsx   (Photo/video gallery)
├── MediaThumbnail.tsx       (Thumbnail component)
├── MediaFilter.tsx          (Filter controls)
├── PresentationMode.tsx     (Fullscreen slideshow)
└── MediaManager.tsx         (Instructor photo tools)

utils/
├── exifOrientation.ts       (EXIF handling)
└── clientLinks.ts           (Link generation)

services/
└── mediaService.ts          (Media CRUD operations)
```

---

## 🚀 CURRENT STATUS

**Overall Progress**: 0% Complete

**Next Steps**:
1. Create base ClientLobby component
2. Add routing for `/client/:gameId`
3. Integrate CLIENT button on landing page
4. Implement game chooser for active/completed games

---

**Last Updated**: $(date)
**Developer**: AI Assistant
**Project**: Teambattle Danmark - Client Zone Implementation
