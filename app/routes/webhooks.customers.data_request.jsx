import { authenticate } from "../shopify.server.js";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(
    request
  );

  console.log(`Received ${topic} webhook for ${shop}`);
  
  // This app does not store any customer data, so we just acknowledge receipt
  
  return new Response(null, { status: 200 });
};
