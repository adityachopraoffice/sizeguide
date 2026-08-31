import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  Grid,
  Badge,
  List,
  Banner
} from "@shopify/polaris";
import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";

export async function loader({ request }) {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  let currentPlan = "free";
  try {
    const billingCheck = await billing.check({
      plans: ["Basic", "Pro"],
      isTest: true,
    });
    
    if (billingCheck.hasActivePayment) {
      if (billingCheck.appSubscriptions.some(sub => sub.name === "Pro")) currentPlan = "pro";
      else if (billingCheck.appSubscriptions.some(sub => sub.name === "Basic")) currentPlan = "basic";
    }
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Billing check failed (Shopify Glitch):", error);
    
    // Fallback to database
    const shopSettings = await prisma.shopSettings.findUnique({ where: { shop } });
    if (shopSettings) {
      currentPlan = shopSettings.currentPlan;
    }
  }
  
  // Ensure DB matches current plan
  await prisma.shopSettings.upsert({
    where: { shop },
    update: { currentPlan },
    create: { shop, currentPlan }
  });

  return json({ currentPlan });
}

export async function action({ request }) {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const planName = formData.get("plan");

  let billingPlan = "Free";
  if (planName === "Pro") billingPlan = "Pro";
  else if (planName === "Basic") billingPlan = "Basic";

  if (billingPlan === "Free") {
    try {
      const billingCheck = await billing.check({
        plans: ["Basic", "Pro"],
        isTest: true,
      });
      const subscription = billingCheck.appSubscriptions[0];
      if (subscription) {
        await billing.cancel({
          subscriptionId: subscription.id,
          isTest: true,
          prorate: true,
        });
      }
    } catch (error) {
      if (error instanceof Response) throw error;
      console.error("Billing cancel failed:", error);
    }
    return redirect("/app/billing");
  }

  const url = new URL(request.url);
  const host = url.host;

  try {
    await billing.require({
      plans: [billingPlan],
      isTest: true,
      onFailure: async () => billing.request({
        plan: billingPlan,
        isTest: true,
        returnUrl: `https://${host}/app/billing`,
      }),
    });
  } catch (error) {
    if (error instanceof Response || (error && typeof error.status === 'number')) throw error;
    console.error("CRITICAL BILLING ERROR:", error);
    return json({ error: `Billing Error: ${error.message || JSON.stringify(error)}` }, { status: 400 });
  }

  return redirect("/app/billing");
}

export default function Billing() {
  const { currentPlan } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData();

  const isSubmitting = navigation.state === "submitting";
  const planData = navigation.formData?.get("plan");

  const handleUpgrade = (planName) => {
    submit({ plan: planName }, { method: "post" });
  };

  return (
    <Page title="Manage Subscription">
      <Layout>
        <Layout.Section>
          {actionData?.error && (
            <div style={{ marginBottom: "20px" }}>
              <Banner tone="critical" title="Shopify Error">
                <p>{actionData.error}</p>
              </Banner>
            </div>
          )}
          <Grid>
            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 4, lg: 4, xl: 4}}>
              <Card>
                <BlockStack gap="400">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="headingLg" as="h2">Free</Text>
                    {currentPlan === "free" && <Badge tone="success">Current Plan</Badge>}
                  </div>
                  <Text variant="headingXl" as="p">$0<span style={{fontSize: "14px", fontWeight: "normal"}}>/mo</span></Text>
                  
                  <List>
                    <List.Item>Minimal template only</List.Item>
                    <List.Item>Default button text only</List.Item>
                    <List.Item>No CM/Inches toggle</List.Item>
                    <List.Item>No custom colors</List.Item>
                  </List>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    {currentPlan === "free" ? (
                      <Button disabled fullWidth>Current Plan</Button>
                    ) : (
                      <Button 
                        fullWidth 
                        onClick={() => handleUpgrade("Free")}
                        loading={isSubmitting && planData === "Free"}
                      >
                        Downgrade to Free
                      </Button>
                    )}
                  </div>
                </BlockStack>
              </Card>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 4, lg: 4, xl: 4}}>
              <Card>
                <BlockStack gap="400">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="headingLg" as="h2">Basic</Text>
                    {currentPlan === "basic" && <Badge tone="success">Current Plan</Badge>}
                  </div>
                  <Text variant="headingXl" as="p">$4.99<span style={{fontSize: "14px", fontWeight: "normal"}}>/mo</span></Text>
                  
                  <List>
                    <List.Item>All 4 templates</List.Item>
                    <List.Item>Custom button text</List.Item>
                    <List.Item>CM/Inches toggle</List.Item>
                    <List.Item>No custom colors</List.Item>
                  </List>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    {currentPlan === "basic" ? (
                      <Button disabled fullWidth>Current Plan</Button>
                    ) : (
                      <Button 
                        primary 
                        fullWidth 
                        onClick={() => handleUpgrade("Basic")}
                        loading={isSubmitting && planData === "Basic"}
                      >
                        Upgrade to Basic
                      </Button>
                    )}
                  </div>
                </BlockStack>
              </Card>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 4, lg: 4, xl: 4}}>
              <Card>
                <BlockStack gap="400">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="headingLg" as="h2">Pro</Text>
                    {currentPlan === "pro" && <Badge tone="success">Current Plan</Badge>}
                  </div>
                  <Text variant="headingXl" as="p">$9.99<span style={{fontSize: "14px", fontWeight: "normal"}}>/mo</span></Text>
                  
                  <List>
                    <List.Item>All 4 templates</List.Item>
                    <List.Item>Custom button text</List.Item>
                    <List.Item>CM/Inches toggle</List.Item>
                    <List.Item>Full color customization</List.Item>
                  </List>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    {currentPlan === "pro" ? (
                      <Button disabled fullWidth>Current Plan</Button>
                    ) : (
                      <Button 
                        primary 
                        fullWidth 
                        onClick={() => handleUpgrade("Pro")}
                        loading={isSubmitting && planData === "Pro"}
                      >
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
