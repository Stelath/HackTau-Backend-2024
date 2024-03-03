import * as logger from "firebase-functions/logger";

interface Location {
  latitude: number;
  longitude: number;
}

export interface SearchParams extends Location {
  radius: number;
}

// interface Headers {
//   "Content-Type": string;
//   "X-Goog-Api-Key": string;
//   "X-Goog-FieldMask": string;
// }

export const getRestaurants = async ({ latitude, longitude, radius }: SearchParams) => {
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
    "languageCode": "en",
  };

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY ?? "",
    "X-Goog-FieldMask":
      "places.displayName,places.formattedAddress,places.types,places.websiteUri,places.rating,places.priceLevel,places.photos",
  };

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: headers
      }
    );

    const json = await res.json();

    logger.info({
      method: "POST",
      body: JSON.stringify(data),
      headers: headers
    });

    const restaurants = json.places.map((place: any) => ({
      types: place.types,
      formattedAddress: place.formattedAddress,
      rating: place.rating,
      websiteUri: place.websiteUri,
      displayName: place.displayName,
      photo: getPhotoUri(place.photos[0].name)
    }));

    return restaurants
  } catch (error) {
    return { error: "Failed to fetch restaurants" };
  }
}

const getPhotoUri = async (photoReference: string) => {
  const url = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=1600&skipHttpRedirect=true`;
  
  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY ?? "",
  };

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: headers,
    });
    
    const json = await res.json();
    const photoUri = json.photoUri;

    return photoUri;
  } catch (error) {
    console.error("Failed to fetch photo", error);
  }
}