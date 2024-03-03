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
    
    if ('error' in restaurants) {
        response.status(500).send(restaurants.error);
        return;
    }

    await docRef.update({ restaurants: restaurants, status: 'active' });
    
    response.send('Circle started');
});

interface JoinCircleParams {
    circleId: string;
    userId: string;
}

export const joinCircle = onRequest(async (request: Request, response: Response) => {
    const { circleId, userId } = request.body as JoinCircleParams;

    const db = admin.firestore();
    const docRef = db.collection('circles').doc(circleId);

    const doc = await docRef.get();
    if (!doc.exists) {
        response.status(404).send('Circle not found');
        return;
    }
    
    await docRef.update({ members: admin.firestore.FieldValue.arrayUnion(userId) });

    response.send('Joined circle');
});
