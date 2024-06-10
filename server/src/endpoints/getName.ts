import {
	OpenAPIRoute,
	OpenAPIRouteSchema,
	Query,
	Uuid,
} from "@cloudflare/itty-router-openapi";

export class GetName extends OpenAPIRoute {
	static schema: OpenAPIRouteSchema = {
		summary: "Fetch the current name of a user",
		parameters: {
			person_id: Query(Uuid, { description: "The UUID of the person to fetch the name for", format: "uuid" }),
		},
		responses: {
			"200": {
				description: "Name fetched successfully",
				schema: {
					name: "Jane Doe",
				}
			},
			"400": {
				description: "Invalid UUID format",
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
		const id = env.PERSON_DURABLE_OBJECT.idFromName(data.query.person_id);
		const stub = env.PERSON_DURABLE_OBJECT.get(id);
		const name = await stub.getName();
		return { name };
	}
}
