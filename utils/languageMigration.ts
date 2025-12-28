import { Game, TaskTemplate, GamePoint } from '../types';
import { detectLanguageFromText } from './i18n';

/**
 * Migrate all tasks in a game to have proper language detection
 */
export const migrateGameTasksLanguage = (game: Game): Game => {
    const updatedPoints = game.points.map(point => ({
        ...point,
        settings: {
            ...point.settings,
            language: detectLanguageFromText(point.task.question || '')
        }
    }));
    
    return {
        ...game,
        points: updatedPoints
    };
};

/**
 * Migrate all tasks in a template library
 */
export const migrateLibraryTasksLanguage = (templates: TaskTemplate[]): TaskTemplate[] => {
    return templates.map(template => ({
        ...template,
        settings: {
            ...template.settings,
            language: detectLanguageFromText(template.task.question || '')
        }
    }));
};

/**
 * Migrate all tasks in an array of games
 */
export const migrateAllGamesLanguage = (games: Game[]): Game[] => {
    return games.map(game => migrateGameTasksLanguage(game));
};

/**
 * Deep check: Migrate both games and their points, plus library templates
 */
export const migrateAllTasksInSystem = async (
    games: Game[],
    library: TaskTemplate[]
): Promise<{ games: Game[]; library: TaskTemplate[] }> => {
    const migratedGames = migrateAllGamesLanguage(games);
    const migratedLibrary = migrateLibraryTasksLanguage(library);
    
    return {
        games: migratedGames,
        library: migratedLibrary
    };
};
