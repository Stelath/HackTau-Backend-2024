import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const getResturants = onRequest((request, response) => {
  const { latitude, longitude, radius } = request.body;

  const data = {
    includedTypes: ["restaurant"],
    maxResultCount: 10,
    locationRestriction: {
      circle: {
        center: {
          latitude,
          longitude,
        },
        radius,
      },
    },
  };

const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
    "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.types,places.websiteUri",
};

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers,
      }
    );

    const json = await res.json();

    response.send(json);
  } catch (error) {
    response.status(500).send({ error: "Failed to fetch restaurants" });
  }
});


// const getPhotos = ( photoURL: string ): string => {
//     // Call Maps api for photos for restruant given uri
//     const photoId = photoURL.split('/').pop(); // Extracting the photo ID from the name
//     if (!photoId) {
//         throw new Error('Invalid input name format');
//     }

//     // Constructing the URI using the extracted photo ID
//     const photoUri = `https://lh3.googleusercontent.com/${photoId}=s4800-h1600`;
//     return photoUri;
// }

// // Example usage:
// const inputName = 'places/ChIJURDKN2eAhYARN0AMzUEaiKo/photos/ATplDJaNy1-QZDzIq3CxShNo8tOx-JfsfVcGW-GT-s634jS_R_FJRqZa3jWeUN_uUzhYn_dhhe6pK4PULbv_Kr_Mb1hKvXGKS1I7nHhTFRiWCx-YzZCi5LvHDwpH-lw447bCWcMTEAqsxhLdSiliIOBbR0p_OeBMf_Z3O9y1/media';

// try {
//     const photoUri = getPhotos(inputName);
//     console.log('Photo URI:', photoUri);
// } catch (error:any) {
//     console.error('Error:', error.message);
// }
