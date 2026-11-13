import {http,HttpResponse} from "msw/http";
import {mockPlaces,asGooglePlace} from "../../packages/registration/src/mock-places";
export const googleHandlers=[
 http.post("https://places.googleapis.com/v1/places:searchText",()=>HttpResponse.json({places:mockPlaces.map(asGooglePlace)})),
 http.get("https://places.googleapis.com/v1/places/:id",({params})=>{const p=mockPlaces.find(p=>p.placeId===params.id);return p?HttpResponse.json(asGooglePlace(p)):HttpResponse.json({error:{status:"NOT_FOUND"}},{status:404});}),
];
