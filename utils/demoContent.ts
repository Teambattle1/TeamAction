
import { TaskTemplate, TaskList, IconId, Team, TeamMemberData, Game } from '../types';
import * as db from '../services/db';

const createDemoTask = (
  idSuffix: string, 
  title: string, 
  type: any, 
  question: string, 
  icon: IconId, 
  extras: any = {}
): TaskTemplate => ({
  id: `demo-task-${idSuffix}`,
  title,
  iconId: icon,
  tags: ['demo'],
  createdAt: Date.now(),
  points: 100,
  task: {
    type,
    question,
    ...extras
  },
  feedback: {
    correctMessage: 'Great job!',
    showCorrectMessage: true,
    incorrectMessage: 'Not quite right, try again.',
    showIncorrectMessage: true,
    hint: 'Think outside the box!',
    hintCost: 10
  },
  settings: {
    scoreDependsOnSpeed: false,
    language: 'English',
    showAnswerStatus: true,
    showCorrectAnswerOnMiss: false
  }
});

export const DEMO_TASKS: TaskTemplate[] = [
  createDemoTask('1', 'Welcome Check-in', 'text', 'What is the name of this app?', 'flag', { answer: 'GeoHunt', placeholder: 'Enter the app name...' }),
  createDemoTask('2', 'History Trivia', 'multiple_choice', 'Which year did the first human land on the moon?', 'question', { options: ['1965', '1969', '1972', '1980'], answer: '1969' }),
  createDemoTask('3', 'Park Features', 'checkbox', 'Select all items you can typically find in a park:', 'treasure', { options: ['Benches', 'Traffic Lights', 'Trees', 'Submarines'], correctAnswers: ['Benches', 'Trees'] }),
  createDemoTask('4', 'True or False', 'boolean', 'The sun rises in the West.', 'star', { answer: 'False' }),
  createDemoTask('5', 'Distance Guess', 'slider', 'Estimate the height of a standard basketball hoop in feet.', 'trophy', { range: { min: 0, max: 20, step: 1, correctValue: 10, tolerance: 1 } }),
  createDemoTask('6', 'Coffee Preference', 'dropdown', 'Which of these is made with espresso and steamed milk foam?', 'default', { options: ['Americano', 'Cappuccino', 'Cold Brew', 'Tea'], answer: 'Cappuccino' }),
  createDemoTask('7', 'Pizza Toppings', 'multi_select_dropdown', 'Select typical vegetarian toppings:', 'skull', { options: ['Pepperoni', 'Mushrooms', 'Peppers', 'Sausage', 'Onions'], correctAnswers: ['Mushrooms', 'Peppers', 'Onions'] }),
  createDemoTask('8', 'Visual Puzzle', 'text', 'Look at the image. How many legs does this creature have?', 'camera', { imageUrl: 'https://images.unsplash.com/photo-1559438036-749c95d436a5?auto=format&fit=crop&w=400&q=80', answer: '8' }),
];

export const DEMO_LISTS: TaskList[] = [
  {
    id: 'demo-list-1',
    name: 'Demo: Mixed Trivia',
    description: 'A mix of history, logic, and observation tasks.',
    color: '#3b82f6',
    createdAt: Date.now(),
    tasks: [DEMO_TASKS[0], DEMO_TASKS[1], DEMO_TASKS[3], DEMO_TASKS[5]]
  }
];

export const seedDatabase = async () => {
  let count = 0;
  try {
    // 1. Save Tasks & Lists
    for (const task of DEMO_TASKS) { await db.saveTemplate(task); count++; }
    for (const list of DEMO_LISTS) { await db.saveTaskList(list); }

    // 2. Create "Simon's Game"
    const simonGameId = `game-simon-${Date.now()}`;
    const simonGame: Game = {
        id: simonGameId,
        name: "Simon's Game",
        description: "A demo game with pre-loaded teams and scores.",
        createdAt: Date.now(),
        points: DEMO_TASKS.map((t, i) => ({
            ...t,
            id: `p-${Date.now()}-${i}`,
            location: { lat: 55.6761 + (Math.random() * 0.01 - 0.005), lng: 12.5683 + (Math.random() * 0.01 - 0.005) }, // Random scatter around Copenhagen
            radiusMeters: 30,
            activationTypes: ['radius'],
            isUnlocked: true,
            isCompleted: false,
            order: i,
            points: 100
        })),
        client: { name: "Demo Corp", playingDate: new Date().toISOString() }
    };
    await db.saveGame(simonGame);

    // 3. Create Teams for Simon's Game
    const teamsData = [
        { name: 'Team Alpha', score: 1500, color: 'red' },
        { name: 'Team Bravo', score: 1200, color: 'blue' },
        { name: 'Team Charlie', score: 800, color: 'green' },
        { name: 'Team Delta', score: 2300, color: 'yellow' } // The Leader
    ];

    for (const t of teamsData) {
        const teamId = `team-${t.name.replace(/\s+/g, '-').toLowerCase()}-${simonGameId}`;
        const team: Team = {
            id: teamId,
            gameId: simonGameId,
            name: t.name,
            joinCode: Math.floor(1000 + Math.random() * 9000).toString(),
            score: t.score,
            members: [
                { name: `Agent ${t.name.split(' ')[1]} 1`, deviceId: `dev-${t.name}-1` },
                { name: `Agent ${t.name.split(' ')[1]} 2`, deviceId: `dev-${t.name}-2` }
            ],
            updatedAt: new Date().toISOString(),
            isStarted: true
        };
        await db.registerTeam(team);
    }

    return { success: true, message: `Created "Simon's Game" with 4 teams.` };
  } catch (e: any) {
    console.error(e);
    return { success: false, message: `Error seeding data: ${e.message}` };
  }
};

export const seedTeams = async (gameId: string) => {
    // Legacy support if needed
    return true; 
};
