import { Page, Layout, Card, Text, BlockStack, InlineStack, Button, CalloutCard, InlineGrid, Box, Badge } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server.js";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  try {
    const { billing } = await authenticate.admin(request);
    
    let currentPlan = "Free";
    try {
      const billingCheck = await billing.check({
        plans: ["Basic", "Pro"],
        isTest: true,
      });
      
      if (billingCheck.hasActivePayment) {
        if (billingCheck.appSubscriptions.some(sub => sub.name === "Pro")) currentPlan = "Pro";
        else if (billingCheck.appSubscriptions.some(sub => sub.name === "Basic")) currentPlan = "Basic";
      }
    } catch (error) {
      if (error instanceof Response) throw error; 
      console.error("Dashboard billing check failed:", error);
    }
    
    return json({ currentPlan });
  } catch (error) {
    if (error instanceof Response) throw error; 
    console.error("DASHBOARD LOADER FATAL ERROR:", error);
    throw error;
  }
};

export default function Dashboard() {
  const { currentPlan } = useLoaderData();
  
  return (
    <Page fullWidth>
      <TitleBar title="Dashboard" />
      <BlockStack gap="500">
        
        {/* Custom Hero Section */}
        <Box 
          background="bg-surface-magic" 
          padding="800" 
          borderRadius="300"
          shadow="300"
        >
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Text variant="heading3xl" as="h1">
              Welcome to Size Guide Pro
            </Text>
            <div style={{ marginTop: "16px", marginBottom: "32px" }}>
              <Text variant="bodyLg" as="p" tone="subdued">
                Increase conversions, reduce returns, and boost customer confidence with beautiful size charts.
              </Text>
            </div>
            <InlineStack gap="300" align="center">
              <Button url="/app/settings" variant="primary" size="large">
                Configure Size Guide
              </Button>
              <Button url="/app/billing" size="large">
                Manage Subscription
              </Button>
            </InlineStack>
          </div>
        </Box>

        <Layout>
          <Layout.Section variant="oneThird">
            <Card roundedAbove="sm">
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">Active Plan</Text>
                <InlineStack align="start" blockAlign="center" gap="200">
                  <Text as="p" variant="heading2xl">{currentPlan}</Text>
                  {currentPlan !== "Free" && <Badge tone="success">Active</Badge>}
                </InlineStack>
                <div style={{ marginTop: "8px" }}>
                  <Button variant="plain" url="/app/billing">Upgrade or change plan</Button>
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section>
            <CalloutCard
              title="Next Step: Enable the App Embed"
              illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
              primaryAction={{
                content: "Go to Theme Editor",
                url: "https://admin.shopify.com/themes/current/editor?context=apps",
                target: "_blank"
              }}
            >
              <p>
                To display your size guide on your storefront, you must enable the App Block in your Theme Editor. 
                Navigate to your Product template, add the "Size Guide" block, and hit Save.
              </p>
            </CalloutCard>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
