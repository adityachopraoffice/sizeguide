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
  Banner,
  Box,
  InlineStack,
  Divider,
  Icon
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
    
    const shopSettings = await prisma.shopSettings.findUnique({ where: { shop } });
    if (shopSettings) {
      currentPlan = shopSettings.currentPlan;
    }
  }
  
  await prisma.shopSettings.upsert({
    where: { shop },
    update: { currentPlan },
    create: { shop, currentPlan }
  });

  return json({ currentPlan });
}

export async function action({ request }) {
  const { session, billing } = await authenticate.admin(request);
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
    }
    return redirect("/app/billing");
  }

  try {
    await billing.require({
      plans: [billingPlan],
      isTest: true,
      onFailure: async () => billing.request({
        plan: billingPlan,
        isTest: true,
        returnUrl: `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.SHOPIFY_API_KEY}/app/billing`,
      }),
    });
  } catch (error) {
    if (error instanceof Response || (error && typeof error.status === 'number')) throw error;
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

  const CheckIcon = () => (
    <span style={{ color: "#29845a", marginRight: "8px", fontWeight: "bold" }}>✓</span>
  );
  
  const CrossIcon = () => (
    <span style={{ color: "#8c9196", marginRight: "8px", fontWeight: "bold" }}>✕</span>
  );

  return (
    <Page 
      title="Manage Subscription" 
      subtitle="Unlock advanced templates and full color customization with a premium plan."
    >
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
            {/* FREE PLAN */}
            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 4, lg: 4, xl: 4}}>
              <Card background={currentPlan === "free" ? "bg-surface-active" : "bg-surface"}>
                <BlockStack gap="500">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="headingLg" as="h2">Free</Text>
                    {currentPlan === "free" && <Badge tone="success">Active</Badge>}
                  </div>
                  
                  <Box paddingBlockEnd="400">
                    <Text variant="heading3xl" as="p">$0</Text>
                    <Text tone="subdued" as="span">Free forever</Text>
                  </Box>
                  
                  <Divider />
                  
                  <BlockStack gap="300">
                    <div style={{ marginTop: "16px" }} />
                    <Text as="p"><CheckIcon /> Unlimited product views</Text>
                    <Text as="p"><CheckIcon /> Minimal template</Text>
                    <Text as="p" tone="subdued"><CrossIcon /> Custom button text</Text>
                    <Text as="p" tone="subdued"><CrossIcon /> Premium templates</Text>
                    <Text as="p" tone="subdued"><CrossIcon /> Full color customization</Text>
                  </BlockStack>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                    {currentPlan === "free" ? (
                      <Button disabled fullWidth size="large">Current Plan</Button>
                    ) : (
                      <Button 
                        fullWidth 
                        size="large"
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
            
            {/* BASIC PLAN */}
            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 4, lg: 4, xl: 4}}>
              <Card background={currentPlan === "basic" ? "bg-surface-active" : "bg-surface"}>
                <BlockStack gap="500">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="headingLg" as="h2">Basic</Text>
                    {currentPlan === "basic" && <Badge tone="success">Active</Badge>}
                  </div>
                  
                  <Box paddingBlockEnd="400">
                    <InlineStack align="start" blockAlign="baseline" gap="100">
                      <Text variant="heading3xl" as="p">$4.99</Text>
                      <Text tone="subdued" as="span">/ month</Text>
                    </InlineStack>
                  </Box>
                  
                  <Divider />
                  
                  <BlockStack gap="300">
                    <div style={{ marginTop: "16px" }} />
                    <Text as="p"><CheckIcon /> Unlimited product views</Text>
                    <Text as="p"><CheckIcon /> Custom button text</Text>
                    <Text as="p"><CheckIcon /> All 4 Premium Templates</Text>
                    <Text as="p" tone="subdued"><CrossIcon /> Custom template colors</Text>
                    <Text as="p" tone="subdued"><CrossIcon /> Custom button colors</Text>
                  </BlockStack>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                    {currentPlan === "basic" ? (
                      <Button disabled fullWidth size="large">Current Plan</Button>
                    ) : (
                      <Button 
                        fullWidth 
                        size="large"
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
            
            {/* PRO PLAN */}
            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 4, lg: 4, xl: 4}}>
              {/* Wrapping Card in a specialized border wrapper to make it pop */}
              <div style={{ 
                border: "2px solid #005bd3", 
                borderRadius: "10px", 
                boxShadow: "0 10px 20px rgba(0, 91, 211, 0.15)",
                position: "relative",
                height: "100%"
              }}>
                {currentPlan !== "pro" && (
                  <div style={{ 
                    position: "absolute", 
                    top: "-12px", 
                    left: "50%", 
                    transform: "translateX(-50%)", 
                    background: "#005bd3", 
                    color: "white", 
                    padding: "2px 12px", 
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    zIndex: 1
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <Card background={currentPlan === "pro" ? "bg-surface-active" : "bg-surface"}>
                  <BlockStack gap="500">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="headingLg" as="h2">Pro</Text>
                      {currentPlan === "pro" && <Badge tone="success">Active</Badge>}
                    </div>
                    
                    <Box paddingBlockEnd="400">
                      <InlineStack align="start" blockAlign="baseline" gap="100">
                        <Text variant="heading3xl" as="p">$9.99</Text>
                        <Text tone="subdued" as="span">/ month</Text>
                      </InlineStack>
                    </Box>
                    
                    <Divider />
                    
                    <BlockStack gap="300">
                      <div style={{ marginTop: "16px" }} />
                      <Text as="p"><CheckIcon /> Unlimited product views</Text>
                      <Text as="p"><CheckIcon /> Custom button text</Text>
                      <Text as="p"><CheckIcon /> All 4 Premium Templates</Text>
                      <Text as="p"><CheckIcon /> Custom template colors</Text>
                      <Text as="p"><CheckIcon /> Custom button colors</Text>
                    </BlockStack>
                    
                    <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                      {currentPlan === "pro" ? (
                        <Button disabled fullWidth size="large">Current Plan</Button>
                      ) : (
                        <Button 
                          primary 
                          fullWidth 
                          size="large"
                          onClick={() => handleUpgrade("Pro")}
                          loading={isSubmitting && planData === "Pro"}
                        >
                          Upgrade to Pro
                        </Button>
                      )}
                    </div>
                  </BlockStack>
                </Card>
              </div>
            </Grid.Cell>
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
