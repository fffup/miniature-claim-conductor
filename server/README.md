# Claim Conductor in Miniature

A system that is capable of accepting webhooks with updates to a
person's name from a simulated phone book provider, which then must be capable of processing the
webhooks and updating the system's internal state of understanding about the person.

## Get started
The following steps assume that you have Node.js and nvm [nvm](https://github.com/nvm-sh/nvm), and have installed node version 20. 

To set up and start a local server, run
```
nvm use
npm i
npm run dev
```
The service will now be available on `http://localhost:8787/v1`. You can interact with it via the [docs](http://localhost:8787/v1/docs) or [ReDoc](http://localhost:8787/v1/redoc).

## Testing
You can seed the service by running the dummy data generator script. You can run the script as many times as you like. It sends 100 events to the service each time.
```
cd test/integration
python -m venv .
source ./bin/activate
python ./elysian_PhonebookDummyDataGenerator.py
```

## Deployment
The service runs as a Cloudflare Worker and uses Cloudflare Durable Objects. You need a paid Cloudflare account ($5/month) to use Durable Objects. Deploy the service by running
```
npm run deploy
```
The service is available on [Cloudflare](https://cloudflare-server.fffup-account.workers.dev/v1/docs).

## Project structure
1. The main router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.
3. For more information see the [itty-router-openapi official documentation](https://cloudflare.github.io/itty-router-openapi/).

## Design Overview

### Approach
The service stores the list of events received for each person ID in reverse chronological order. Getting the name is then achieved by reading the name of the most recent event. This approach assumes that the external phone book provider is well behaved. Given more information about the provider, I'd adjust the application layer to deal with e.g. a `PersonRenamed` for an unknown person_id; a `PersonRemoved` event followed by an `PersonAdded` or `PersonRenamed` with a more recent timestamp.

### Further considerations
- Unit tests, Dependency Injection (probably tsyringe).
- Integration tests (probably with Postman).
- A thorough code review to ensure no race conditions, with reference to the [Cloudflare API docs](https://developers.cloudflare.com/durable-objects/api/transactional-storage-api/).
- Further evaluation of scaling abilities of Cloudflare Durable Objects
- I didn't get to building a frontend. I'd consider using an LLM to interpret the questions and extract the necessary information for retrieving information from the backend service.

