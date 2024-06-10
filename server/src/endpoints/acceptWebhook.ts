import {
	DateTime,
	OpenAPIRoute,
	OpenAPIRouteSchema,
	RouteOptions,
	Str,
	Uuid,
} from "@cloudflare/itty-router-openapi";
import { z } from "zod";

const personAdded = z.strictObject({
	payload_type: z.literal("PersonAdded"),
	payload_content: z.object({
		person_id: new Uuid({ description: "Unique identifier for the person", example: "111e2222-e89b-12d3-a456-426614174000" }),
		name: new Str({ description: "Name of the person", example: "John Doe" }),
		timestamp: new DateTime({ description: "ISO datetime string when the person was added", example: "2024-04-12T23:20:50.520Z" }),
	})
});

const personRenamed = z.strictObject({
	payload_type: z.literal("PersonRenamed"),
	payload_content: z.object({
		person_id: new Uuid({ description: "Unique identifier for the person", example: "111e2222-e89b-12d3-a456-426614174000" }),
		name: new Str({ description: "New name of the person", example: "Jane Doe" }),
		timestamp: new DateTime({ description: "ISO datetime string when the person was renamed", example: "2024-04-12T23:30:50.520Z" }),
	})
});

const personRemoved = z.strictObject({
	payload_type: z.literal("PersonRemoved"),
	payload_content: z.object({
		person_id: new Uuid({ description: "Unique identifier for the person", example: "111e2222-e89b-12d3-a456-426614174000" }),
		timestamp: new DateTime({ description: "ISO datetime string when the person was renamed", example: "2024-04-12T23:40:50.520Z" }),
		// FIXME Validation succeeds when name is present despite using strictObject.
		// This at least prevents the caller specifying anything other than null.
		name: z.null().optional().describe("Do not provide this field, it will always be null"),
	})
});

export const personEvent = z.discriminatedUnion("payload_type", [personAdded, personRenamed, personRemoved]);

export type PersonEvent = z.infer<typeof personEvent>;

export class AcceptWebhook extends OpenAPIRoute {
	private name: string;
	constructor(params: RouteOptions, name: string) {
		super(params);
		this.name = name;

	}
	static schema: OpenAPIRouteSchema = {
		summary: "Accept webhook notifications about user updates",
		requestBody: personEvent,
		responses: {
			"200": {
				description: "Webhook processed successfully",
			},
			"400": {
				description: "Invalid input",
			},
			"500": {
				description: "Server error",
			},
		},
	};

	async handle(
		_request: Request,
		env: any,
		_context: any,
		data: Record<string, any>
	) {
		const event = data.body as PersonEvent;
		const id = env.PERSON_DURABLE_OBJECT.idFromName(event.payload_content.person_id);
		const stub = env.PERSON_DURABLE_OBJECT.get(id);
		await stub.addEvent(event);
		return new Response();
	}
}
