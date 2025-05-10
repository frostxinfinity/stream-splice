// src/app/api/moderate/predictions/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createPrediction } from '@/lib/twitchApi'; // Assuming endPrediction will be added here too
import type { TwitchPredictionRequest } from '@/types';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.userId || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const predictionData = await request.json() as Omit<TwitchPredictionRequest, 'broadcaster_id'>;
    
    if (!predictionData.title || !predictionData.outcomes || predictionData.outcomes.length !== 2 || !predictionData.prediction_window) {
        return NextResponse.json({ error: 'Invalid prediction data. Title, exactly 2 outcomes, and prediction window are required.' }, { status: 400 });
    }
    if (predictionData.outcomes.some(o => !o.title || o.title.length > 25)) {
        return NextResponse.json({ error: 'Invalid outcome title. Max 25 characters per outcome.' }, { status: 400 });
    }
    if (predictionData.title.length > 45) {
        return NextResponse.json({ error: 'Prediction title exceeds 45 characters.' }, { status: 400 });
    }
    if (predictionData.prediction_window < 30 || predictionData.prediction_window > 1800) {
        return NextResponse.json({ error: 'Prediction window must be between 30 and 1800 seconds.' }, { status: 400 });
    }

    // The broadcaster_id for createPrediction is the ID of the channel where the prediction is created.
    // This should be passed from the client, typically stream.user_id
    const broadcasterId = request.headers.get('X-Broadcaster-ID');
    if (!broadcasterId) {
        return NextResponse.json({ error: 'X-Broadcaster-ID header is required.' }, { status: 400 });
    }

    const fullPredictionData: TwitchPredictionRequest = {
      ...predictionData,
      broadcaster_id: broadcasterId,
    };

    const createdPrediction = await createPrediction(fullPredictionData, session.accessToken);
    return NextResponse.json({ success: true, prediction: createdPrediction, message: 'Prediction created successfully.' });
  } catch (error: any) {
    console.error('Error in /api/moderate/predictions POST:', error);
    const errorMessage = error.twitchError?.message || error.message || 'Failed to create prediction.';
    const errorStatus = error.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}

// PATCH handler for ending predictions could be added here if needed later
// import { endPrediction } from '@/lib/twitchApi';
// import type { TwitchEndPredictionRequest } from '@/types';
// export async function PATCH(request: NextRequest) { ... }