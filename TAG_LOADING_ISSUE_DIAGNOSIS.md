# Tag Loading Issue in Playzone Task Editor

## Problem Description
- Tasks in the playzone task list (Picture 1) display the "TEAMCHALLENGE" tag
- When editing the same task in the Task Editor (Picture 2), the tags field is empty
- This suggests tags are being loaded/displayed in the list but not in the editor

## Root Cause Analysis

### What's Working Correctly ✅
In `components/PlaygroundEditor.tsx` (lines 5519-5560 and 5288-5329):
- Tags ARE being copied when tasks are imported: `tags: t.tags`
- Both playzone and map task imports preserve tags
- Task list rendering should show tags from the GamePoint object

### Potential Issues

1. **Task Selection Issue**: The `selectedTask` might not have the `tags` property loaded
   - In `PlaygroundEditor.tsx` line 1037: `const selectedTask = game.points?.find(p => p.id === selectedTaskId && p.playgroundId === activePlayground?.id);`
   - If `game.points` doesn't include `tags`, then `selectedTask.tags` will be undefined

2. **Component State Not Syncing**: The TaskEditor initializes from the point's tags on line 152 of `TaskEditor.tsx`:
   ```typescript
   tags: point.tags || []
   ```
   - If `point.tags` is undefined, this correctly defaults to `[]`
   - But the UI TAGS tab should still show existing tags if they're in the GamePoint object

3. **Data Source Mismatch**: The list view in Picture 1 might be reading from:
   - Database directly (task library/templates)
   - Different game object than what's passed to TaskEditor

## Recommendation

The user's hypothesis about "global task copy" is partially correct:
- When tasks are imported from the library into a playzone, the tags ARE copied
- However, if the task was created BEFORE this feature existed, it might not have tags in the GamePoint object
- Or there could be a synchronization issue where the UI shows cached tags but the actual game data doesn't have them

## What to Check

1. **Verify the game.points object** includes tags for all tasks
2. **Check if tasks were created before tag support** - they might not have the `tags` property at all
3. **Inspect the database** to see if media_submissions or game_points records actually store tags
4. **Look for any tag migration logic** - old tasks might need to have tags populated from an external source

## Solution Options

### Option A: Fix Data Loading (Safest)
Ensure that when tasks are loaded from the database, tags are properly populated on the GamePoint objects.

### Option B: Fix UI Display
In the TaskEditor GENERAL tab, add a mini tag display so users can see what tags a task has without switching to the TAGS tab.

### Option C: Add Data Migration
Create a one-time migration that loads tags from the task library (TaskTemplate) and applies them to any GamePoints that reference those tasks but don't have tags stored.
