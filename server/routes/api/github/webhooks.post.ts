
import type { WebhookEventName } from '@octokit/webhooks-types'
import app from "../../../../src/index"

export default async function (request: Request) {
  const eventName = request.headers.get('x-github-event') as WebhookEventName
  const signatureSHA256 = request.headers.get('x-hub-signature-256') as string
  const id = request.headers.get('x-github-delivery') as string
  const body = await request.text()

  if (!body || !signatureSHA256 || !id || !eventName) {
    return new Response('Bad request', { status: 400 })
  }

  try {
    await app.webhooks.verifyAndReceive({
      id,
      name: eventName,
      payload: JSON.parse(body),
      signature: signatureSHA256
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}
