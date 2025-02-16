import type { WebhookEventName } from "@octokit/webhooks-types";
import { eventHandler, readRawBody } from "h3";
import { createProbot } from "probot";

const probot = createProbot();

export default eventHandler(async (event) => {
  const eventName = event.headers.get("x-github-event") as WebhookEventName;
  const signatureSHA256 = event.headers.get("x-hub-signature-256") as string;
  const id = event.headers.get("x-github-delivery") as string;
  const body = await readRawBody(event);

  if (!body || !signatureSHA256 || !id || !eventName) {
    return new Response("Bad request", { status: 400 });
  }

  probot.webhooks.verifyAndReceive({
    id,
    name: eventName,
    payload: body,
    signature: signatureSHA256,
  });
});
