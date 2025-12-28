import { Game, TaskTemplate, GamePoint } from '../types';
import { detectLanguageFromText, normalizeLanguage } from './i18n';

/**
 * Migrate all tasks in a game to have proper language detection
 */
export const migrateGameTasksLanguage = (game: Game): Game => {
    const updatedPoints = game.points.map(point => {
        // First normalize the current language (remove "global")
        const currentLang = normalizeLanguage(point.settings?.language);

        // If it's English (default), try to detect from question
        const newLang = currentLang === 'English'
            ? detectLanguageFromText(point.task.question || '')
            : currentLang;

        return {
            ...point,
            settings: {
                ...point.settings,
                language: newLang
            }
        };
    });

    return {
        ...game,
        points: updatedPoints
    };
};

/**
 * Migrate all tasks in a template library
 */
export const migrateLibraryTasksLanguage = (templates: TaskTemplate[]): TaskTemplate[] => {
    return templates.map(template => {
        // First normalize the current language (remove "global")
        const currentLang = normalizeLanguage(template.settings?.language);

        // If it's English (default), try to detect from question
        const newLang = currentLang === 'English'
            ? detectLanguageFromText(template.task.question || '')
            : currentLang;

        return {
            ...template,
            settings: {
                ...template.settings,
                language: newLang
            }
        };
    });
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
