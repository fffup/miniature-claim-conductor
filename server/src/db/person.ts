import { DurableObject } from "cloudflare:workers";
import { PersonEvent } from "endpoints/acceptWebhook";

export class PersonDurableObject extends DurableObject {
    async getName(): Promise<String | null> {
        const events = await this.getEvents();
        return events[0]?.payload_content.name || null;
    }

    async addEvent(event: PersonEvent): Promise<void> {
        const events = await this.getEvents();
        events.push(event);
        events.sort((a, b) => b.payload_content.timestamp.localeCompare(a.payload_content.timestamp));
        this.ctx.storage.put({ events });
    }

    async getEvents(): Promise<PersonEvent[]> {
        const events = await this.ctx.storage.get<PersonEvent[]>("events") || [];
        return events;
    }

    async listPeople(): Promise<string[]> {
        const people = await this.ctx.storage.list();
        return Array.from(people.keys());
    }
}

export interface Env {
    PERSON_DURABLE_OBJECT: DurableObjectNamespace<PersonDurableObject>;
}
