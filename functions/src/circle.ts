import { onRequest } from "firebase-functions/v2/https";
import { Request, Response } from "express";
import * as admin from 'firebase-admin';
// import * as logger from "firebase-functions/logger";
// import { FieldValue } from "firebase-admin/firestore"

import { getRestaurants, SearchParams } from "./restaurants";

export const createCircle = onRequest(async (request: Request, response: Response) => {
    // logger.info("REQUEST BODY", request.body);
    // logger.info("REQUEST BODY Data", request.body.data);
    let { userId } = request.body;
    if (!userId) {
        let { data } = request.body;
        if (data && data.userId) {
            userId = data.userId;
        } else {
            response.status(400).send('User ID is missing');
            return;
        }
    }

  const db = admin.firestore();

  const randomString = Math.random().toString(36).substring(2, 7);
  const docRef = db.collection('circles').doc(randomString);

const userDoc = await db.collection('users').doc(userId).get();
const username = userDoc.get('username');

await docRef.set({
    owner: userId,
    members: [{ userId, username }],
    status: 'pending'
});

  response.send({data: {circleId: docRef.id}});
});

interface StartCircleParams extends SearchParams {
    circleId: string;
}

export const startCircle = onRequest(async (request: Request, response: Response) => {
    const { circleId, latitude, longitude, radius } = request.body.latitude != null ? request.body as StartCircleParams: request.body.data as StartCircleParams;
    
    const db = admin.firestore();
    const docRef = db.collection('circles').doc(circleId);
    
    const {restaurants, ranked} = await getRestaurants({ latitude, longitude, radius });
    
    if (restaurants && 'error' in restaurants) {
        response.status(500).send(restaurants.error);
        return;
    }

    // console.log('ranked', ranked);
    await docRef.update({ restaurants: restaurants, ranked: ranked, status: 'active' });
    
    response.send({data: {response: 'Circle started'}});
});

interface JoinCircleParams {
    circleId: string;
    userId: string;
}

export const joinCircle = onRequest(async (request: Request, response: Response) => {
    const { circleId, userId } = request.body.circleId != null ? request.body as JoinCircleParams: request.body.data as JoinCircleParams;

    const db = admin.firestore();
    const docRef = db.collection('circles').doc(circleId);

    const circleDoc = await docRef.get();
    if (!circleDoc.exists) {
        response.status(404).send('Circle not found');
        return;
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const username = userDoc.get('username');

    var members = circleDoc.get('members')
    members = [...members, { userId, username }]
    
    await docRef.update({ members });

    response.send({data: {response: 'Circle joined'}});
});
