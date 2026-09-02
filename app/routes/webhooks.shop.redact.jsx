import { authenticate } from "../../shopify.server";
import prisma from "../../db.server.js";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(
    request
  );

  console.log(`Received ${topic} webhook for ${shop}`);
  
  // A shop is requesting data deletion (App uninstalled/store closed for 48 hours)
  // We must delete their settings from our database
  try {
    await prisma.shopSettings.delete({
      where: { shop: shop },
    });
    console.log(`Successfully redacted data for shop: ${shop}`);
  } catch (error) {
    // If the record doesn't exist, it's fine. We still return 200.
    console.log(`Shop data already redacted or missing for: ${shop}`);
  }
  
  return new Response(null, { status: 200 });
};
