// Supabase Edge Function for daily translation validation
// This function checks all games for missing or unapproved translations
// and stores the results in the translation_validation_results table

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

interface TaskTranslation {
  question: string;
  questionApproved?: boolean;
  options?: string[];
  optionsApproved?: boolean;
  answer?: string;
  answerApproved?: boolean;
  correctAnswers?: string[];
  correctAnswersApproved?: boolean;
  placeholder?: string;
  placeholderApproved?: boolean;
  feedback?: {
    correctMessage: string;
    correctMessageApproved?: boolean;
    incorrectMessage: string;
    incorrectMessageApproved?: boolean;
    hint: string;
    hintApproved?: boolean;
  };
}

interface MissingTranslation {
  gameId: string;
  gameName: string;
  pointId: string;
  pointTitle: string;
  language: string;
  missingFields: string[];
  createdAt: string;
}

const isFieldApproved = (translation: any, field: string): boolean => {
  if (translation[field] === undefined || translation[field] === null) {
    return true;
  }

  const approvalField = `${field}Approved`;
  if (translation[approvalField] === undefined) {
    return false;
  }

  return translation[approvalField] as boolean;
};

const isTranslationFullyApproved = (translation: TaskTranslation): boolean => {
  const checks = [
    isFieldApproved(translation, 'question'),
    translation.options ? isFieldApproved(translation, 'options') : true,
    translation.answer ? isFieldApproved(translation, 'answer') : true,
    translation.correctAnswers ? isFieldApproved(translation, 'correctAnswers') : true,
    translation.placeholder ? isFieldApproved(translation, 'placeholder') : true,
  ];

  if (translation.feedback) {
    checks.push(
      translation.feedback.correctMessage ? isFieldApproved(translation.feedback, 'correctMessage') : true,
      translation.feedback.incorrectMessage ? isFieldApproved(translation.feedback, 'incorrectMessage') : true,
      translation.feedback.hint ? isFieldApproved(translation.feedback, 'hint') : true
    );
  }

  return checks.every(check => check === true);
};

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Translation Validator] Starting validation...');

    // Fetch all games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*');

    if (gamesError) {
      console.error('[Translation Validator] Error fetching games:', gamesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch games', details: gamesError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Translation Validator] Found ${games?.length || 0} games`);

    const allMissing: MissingTranslation[] = [];

    // Check each game
    for (const game of games || []) {
      const points = game.points || [];

      // Get all languages used in this game
      const usedLanguages = new Set<string>();
      points.forEach((point: any) => {
        if (point.task?.translations) {
          Object.keys(point.task.translations).forEach(lang => {
            usedLanguages.add(lang);
          });
        }
      });

      console.log(`[Translation Validator] Game "${game.name}" uses languages: ${Array.from(usedLanguages).join(', ')}`);

      // Check each point for each language
      points.forEach((point: any) => {
        usedLanguages.forEach(language => {
          const translation = point.task?.translations?.[language];

          // If translation doesn't exist, add to missing
          if (!translation) {
            allMissing.push({
              gameId: game.id,
              gameName: game.name,
              pointId: point.id,
              pointTitle: point.title,
              language,
              missingFields: ['ALL'],
              createdAt: new Date().toISOString(),
            });
            return;
          }

          // Check which fields are not approved
          const missingFields: string[] = [];

          if (!isFieldApproved(translation, 'question')) {
            missingFields.push('question');
          }
          if (translation.options && !isFieldApproved(translation, 'options')) {
            missingFields.push('options');
          }
          if (translation.answer && !isFieldApproved(translation, 'answer')) {
            missingFields.push('answer');
          }
          if (translation.correctAnswers && !isFieldApproved(translation, 'correctAnswers')) {
            missingFields.push('correctAnswers');
          }
          if (translation.feedback) {
            if (translation.feedback.correctMessage && !isFieldApproved(translation.feedback, 'correctMessage')) {
              missingFields.push('correctMessage');
            }
            if (translation.feedback.incorrectMessage && !isFieldApproved(translation.feedback, 'incorrectMessage')) {
              missingFields.push('incorrectMessage');
            }
            if (translation.feedback.hint && !isFieldApproved(translation.feedback, 'hint')) {
              missingFields.push('hint');
            }
          }

          if (missingFields.length > 0) {
            allMissing.push({
              gameId: game.id,
              gameName: game.name,
              pointId: point.id,
              pointTitle: point.title,
              language,
              missingFields,
              createdAt: new Date().toISOString(),
            });
          }
        });
      });
    }

    console.log(`[Translation Validator] Found ${allMissing.length} missing/unapproved translations`);

    // Store results in database
    if (allMissing.length > 0) {
      // First, clear old results
      const { error: deleteError } = await supabase
        .from('translation_validation_results')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('[Translation Validator] Error clearing old results:', deleteError);
      }

      // Insert new results
      const { error: insertError } = await supabase
        .from('translation_validation_results')
        .insert(allMissing);

      if (insertError) {
        console.error('[Translation Validator] Error inserting results:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store results', details: insertError }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Clear all results if nothing is missing
      const { error: deleteError } = await supabase
        .from('translation_validation_results')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.error('[Translation Validator] Error clearing results:', deleteError);
      }
    }

    console.log('[Translation Validator] Validation complete');

    return new Response(
      JSON.stringify({
        success: true,
        totalGames: games?.length || 0,
        missingTranslations: allMissing.length,
        results: allMissing,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Translation Validator] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
