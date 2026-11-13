import {test,before,after,afterEach} from "node:test";
import assert from "node:assert/strict";
import {setupServer} from "msw/node";
import {http,HttpResponse} from "msw/http";
import {googleHandlers} from "../mocks/google-handlers";
import {handlePlaceSearch} from "../../src/shared/lib/google-places/search-handler";
const server=setupServer(...googleHandlers);
before(()=>server.listen({onUnhandledRequest:"error"}));afterEach(()=>server.resetHandlers());after(()=>server.close());
const request=()=>new Request("http://localhost/api/places/search?q=성수");
test("MSW uses Google's real HTTP response shape without a key or network",async()=>{
 let reservations=0;const response=await handlePlaceSearch(request(),{enabled:true,apiKey:"test-only",reserve:async()=>{reservations++;},fetcher:fetch});
 assert.equal(response.status,200);const body=await response.json();assert.equal(body.length,3);assert.equal(body[0].placeId,"mock-seongsu-cutlet");assert.equal(reservations,1);
});
for(const status of [429,500])test(`MSW provider ${status} preserves error contract`,async()=>{server.use(http.post("https://places.googleapis.com/v1/places:searchText",()=>HttpResponse.json({error:{code:status}},{status})));const response=await handlePlaceSearch(request(),{enabled:true,apiKey:"test-only",reserve:async()=>{},fetcher:fetch});assert.equal(response.status,status===429?429:502);});
