import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { GetName } from "./endpoints/getName";
import { AcceptWebhook } from "./endpoints/acceptWebhook";

export { PersonDurableObject } from "./db/person";

export const router = OpenAPIRouter({
	base: "/v1",
	redoc_url: "/redoc",
	docs_url: "/docs",
	openapiVersion: "3",
});

router.post("/accept_webhook/", AcceptWebhook);
router.get("/get_name/", GetName);

// 404 for everything else
router.all("*", () =>
	Response.json(
		{
			success: false,
			error: "Route not found",
		},
		{ status: 404 }
	)
);

export default {
	fetch: router.handle,
};
