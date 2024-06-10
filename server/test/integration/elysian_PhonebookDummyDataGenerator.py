import uuid
import random
from datetime import datetime
import asyncio
import aiohttp
import time

class PhonebookDummyDataGenerator:
    def __init__(self):
        self.person_ids = []

    def generate_webhook(self):
        while True:
            payload_type = random.choice(['PersonAdded', 'PersonRenamed', 'PersonAdded', 'PersonRenamed', 'PersonRemoved'])
            timestamp = datetime.utcnow().isoformat() + 'Z'

            if payload_type == 'PersonAdded':
                person_id = str(uuid.uuid4())
                self.person_ids.append(person_id)
                name = f"Person {random.randint(100, 999)}"
                payload_content = {
                    "person_id": person_id,
                    "name": name,
                    "timestamp": timestamp
                }

            elif payload_type == 'PersonRenamed':
                if self.person_ids:
                    person_id = random.choice(self.person_ids)
                    name = f"Renamed Person {random.randint(1000, 9999)}"
                    payload_content = {
                        "person_id": person_id,
                        "name": name,
                        "timestamp": timestamp
                    }
                else:
                    continue

            elif payload_type == 'PersonRemoved':
                if self.person_ids:
                    person_id = random.choice(self.person_ids)
                    self.person_ids.remove(person_id)
                    payload_content = {
                        "person_id": person_id,
                        "timestamp": timestamp
                    }
                else:
                    continue

            yield {
                "payload_type": payload_type,
                "payload_content": payload_content
            }

generator = PhonebookDummyDataGenerator()
webhook_generator = generator.generate_webhook()

async def post(session, url, body):
    try:
        async with session.post(url=url, json=body) as response:
            resp = await response.read()
            print("Successfully posted url {} with resp of length {}.".format(url, len(resp)))
    except Exception as e:
        print("Unable to post url {} due to {}.".format(url, e.__class__))

async def get(session, url, params):
    try:
        async with session.get(url=url, params=params) as response:
            resp = await response.read()
            print("Successfully got url {} with resp of length {}.".format(url, len(resp)))
            return [ params, resp ]
    except Exception as e:
        print("Unable to get url {} due to {}.".format(url, e.__class__))

async def send_webhooks(url, events):
    async with aiohttp.ClientSession() as session:
        ret = await asyncio.gather(*(post(session, url, event) for event in events))
    print("Finalized all. Return is a list of len {} outputs.".format(len(ret)))
    return ret

async def get_names(url, person_ids):
    async with aiohttp.ClientSession() as session:
        ret = await asyncio.gather(*(get(session, url, { "person_id": person_id }) for person_id in person_ids))
    print("Finalized all. Return is a list of len {} outputs.".format(len(ret)))
    return ret

events = []
for _ in range(100):
    events.append(next(webhook_generator))

print("Generated {} events.".format(len(events)))

webhook = "http://localhost:8787/v1/accept_webhook"
start = time.time()
asyncio.run(send_webhooks(webhook, events))
end = time.time()

print("Took {} seconds to post {} webhook events.".format(end - start, len(events)))

get_name = "http://localhost:8787/v1/get_name"
start = time.time()
ret = asyncio.run(get_names(get_name, [ event.get("payload_content").get("person_id") for event in events ]))
end = time.time()

print("Took {} seconds to get {} names.".format(end - start, len(events)))
[ print(r) for r in ret ]
