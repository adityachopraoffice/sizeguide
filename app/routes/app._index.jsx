import { Page, Layout, Card, Text, BlockStack, InlineStack, Button, Banner, List, Box } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  return (
    <Page>
      <TitleBar title="Dashboard" />
      <BlockStack gap="500">
        <Banner
          title="Welcome to Size Guide Pro!"
          tone="success"
          action={{ content: "Configure Settings", url: "/app/settings" }}
        >
          <p>
            Your app is installed and ready to go. Follow the steps below to configure your size charts
            and display them on your storefront.
          </p>
        </Banner>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Quick Actions
                </Text>
                <InlineStack gap="300">
                  <Button url="/app/settings" variant="primary">
                    Configure Size Guide
                  </Button>
                  <Button url="/app/billing">Manage Subscription</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Getting Started
                </Text>
                <List type="number">
                  <List.Item>Go to Settings to build your size chart.</List.Item>
                  <List.Item>Customize the popup button text and colors.</List.Item>
                  <List.Item>Go to your Shopify Theme Editor.</List.Item>
                  <List.Item>Enable the "Size Guide" App Embed.</List.Item>
                  <List.Item>Save and publish!</List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
