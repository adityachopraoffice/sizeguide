import { Page, Layout, Card, Text, BlockStack, InlineStack, Button, CalloutCard, InlineGrid, Box, Divider, Icon } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
    return null;
  } catch (error) {
    if (error instanceof Response) throw error; 
    console.error("DASHBOARD LOADER FATAL ERROR:", error);
    throw error;
  }
};

export default function Dashboard() {
  return (
    <Page fullWidth>
      <TitleBar title="Dashboard" />
      <BlockStack gap="500">
        
        {/* Stunning Custom Hero Section */}
        <Box 
          background="bg-surface-brand" 
          padding="800" 
          borderRadius="300"
          shadow="300"
        >
          <div style={{ color: "var(--p-color-text-inverse)", textAlign: "center", padding: "40px 20px" }}>
            <Text variant="heading3xl" as="h1" color="inherit">
              Welcome to Size Guide Pro
            </Text>
            <div style={{ marginTop: "16px", marginBottom: "32px" }}>
              <Text variant="bodyLg" as="p" color="inherit">
                Increase conversions, reduce returns, and boost customer confidence with beautiful size charts.
              </Text>
            </div>
            <InlineStack gap="300" align="center">
              <Button url="/app/settings" variant="primary" size="large" tone="success">
                Configure Size Guide
              </Button>
              <Button url="/app/billing" size="large">
                Manage Subscription
              </Button>
            </InlineStack>
          </div>
        </Box>

        {/* Quick Stats Mockup */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          <Card roundedAbove="sm">
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">Size Guide Views (30 days)</Text>
              <Text as="p" variant="heading2xl">1,240</Text>
              <Text as="p" variant="bodySm" tone="success">↑ 12% from last month</Text>
            </BlockStack>
          </Card>
          <Card roundedAbove="sm">
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">Estimated Returns Prevented</Text>
              <Text as="p" variant="heading2xl">42</Text>
              <Text as="p" variant="bodySm" tone="success">↑ 5% from last month</Text>
            </BlockStack>
          </Card>
          <Card roundedAbove="sm">
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">Active Plan</Text>
              <Text as="p" variant="heading2xl">Pro</Text>
              <div style={{ marginTop: "4px" }}>
                <Button variant="plain" url="/app/billing">View Details</Button>
              </div>
            </BlockStack>
          </Card>
        </InlineGrid>

        <Layout>
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
