import { onRequest } from "firebase-functions/v2/https";
import { Request, Response } from "express";
import * as admin from 'firebase-admin';

import { getRestaurants, SearchParams } from "./restaurants";

export const createCircle = onRequest(async (request: Request, response: Response) => {
    const { userId } = request.body;

  const db = admin.firestore();
  const docRef = db.collection('circles').doc();

  await docRef.set({
    owner: userId,
    members: [userId],
  });

  response.send(docRef.id);
});

interface StartCircleParams extends SearchParams {
    circleId: string;
}

export const startCircle = onRequest(async (request: Request, response: Response) => {
    const { circleId, latitude, longitude, radius } = request.body as StartCircleParams;
    
    const db = admin.firestore();
    const docRef = db.collection('circles').doc(circleId);
    
    const restaurants = await getRestaurants({ latitude, longitude, radius });

    await docRef.update({ restaurants, status: 'active' });
    
    response.send('Circle started');
});
