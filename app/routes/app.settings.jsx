import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Grid,
  Box,
  Badge,
  Tooltip,
  Banner,
  Divider,
  PageActions
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";

const DEFAULT_ROWS = [
  { size: "S", chest: "36", waist: "28", hips: "38" },
  { size: "M", chest: "38", waist: "30", hips: "40" },
  { size: "L", chest: "40", waist: "32", hips: "42" },
  { size: "XL", chest: "42", waist: "34", hips: "44" }
];

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
  }

  let settings = await prisma.shopSettings.findUnique({ where: { shop } });
  if (!settings) {
    settings = {
      buttonText: "Size Guide",
      selectedTemplate: "minimal",
      bgColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#000000",
      buttonTextColor: "#FFFFFF",
      headerBgColor: "#F5F5F5",
      sizeRows: JSON.stringify(DEFAULT_ROWS),
    };
  }
  
  return json({ 
    settings: {
      ...settings,
      currentPlan,
      sizeRows: JSON.parse(settings.sizeRows || "[]")
    }
  });
}

export async function action({ request }) {
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
  }

  let settings = await prisma.shopSettings.findUnique({ where: { shop } });

  const formData = await request.formData();
  
  const buttonText = currentPlan !== "free" ? formData.get("buttonText") : "Size Guide";
  
  let selectedTemplate = formData.get("selectedTemplate");
  if (currentPlan === "free" && selectedTemplate !== "minimal") {
    selectedTemplate = "minimal";
  }
  
  const bgColor = currentPlan === "pro" ? formData.get("bgColor") : "#FFFFFF";
  const textColor = currentPlan === "pro" ? formData.get("textColor") : "#000000";
  const buttonColor = currentPlan === "pro" ? formData.get("buttonColor") : "#000000";
  const buttonTextColor = currentPlan === "pro" ? formData.get("buttonTextColor") : "#FFFFFF";
  const headerBgColor = currentPlan === "pro" ? formData.get("headerBgColor") : "#F5F5F5";
  
  const sizeRows = formData.get("sizeRows");

  await prisma.shopSettings.upsert({
    where: { shop },
    update: {
      buttonText,
      selectedTemplate,
      bgColor,
      textColor,
      buttonColor,
      buttonTextColor,
      headerBgColor,
      currentPlan,
      sizeRows
    },
    create: {
      shop,
      buttonText,
      selectedTemplate,
      bgColor,
      textColor,
      buttonColor,
      buttonTextColor,
      headerBgColor,
      currentPlan,
      sizeRows
    }
  });

  return json({ success: true });
}

export default function Settings() {
  const { settings } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData();

  const [buttonText, setButtonText] = useState(settings.buttonText);
  const [selectedTemplate, setSelectedTemplate] = useState(settings.selectedTemplate);
  const [bgColor, setBgColor] = useState(settings.bgColor);
  const [textColor, setTextColor] = useState(settings.textColor);
  const [buttonColor, setButtonColor] = useState(settings.buttonColor);
  const [buttonTextColor, setButtonTextColor] = useState(settings.buttonTextColor);
  const [headerBgColor, setHeaderBgColor] = useState(settings.headerBgColor);
  const [sizeRows, setSizeRows] = useState(settings.sizeRows);

  const isSaving = navigation.state === "submitting";

  const handleSave = () => {
    const data = {
      buttonText,
      selectedTemplate,
      bgColor,
      textColor,
      buttonColor,
      buttonTextColor,
      headerBgColor,
      sizeRows: JSON.stringify(sizeRows)
    };
    submit(data, { method: "post" });
  };
  
  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show("Settings saved");
    }
  }, [actionData]);

  const addRow = () => {
    setSizeRows([...sizeRows, { size: "", chest: "", waist: "", hips: "" }]);
  };

  const removeRow = (index) => {
    if (sizeRows.length > 1) {
      setSizeRows(sizeRows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index, field, value) => {
    const newRows = [...sizeRows];
    newRows[index][field] = value;
    setSizeRows(newRows);
  };

  const plan = settings.currentPlan;
  const isFree = plan === "free";
  const isPro = plan === "pro";

  return (
    <Page title="SizeGuide Settings">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Button</Text>
                {isFree ? (
                  <Tooltip content="Upgrade to Basic">
                    <Box>
                      <TextField 
                        label="Button Text" 
                        value={buttonText} 
                        disabled 
                        autoComplete="off" 
                      />
                    </Box>
                  </Tooltip>
                ) : (
                  <TextField 
                    label="Button Text" 
                    value={buttonText} 
                    onChange={setButtonText} 
                    autoComplete="off" 
                  />
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Size Chart</Text>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px" }}>Size</th>
                        <th style={{ textAlign: "left", padding: "8px" }}>Chest (cm)</th>
                        <th style={{ textAlign: "left", padding: "8px" }}>Waist (cm)</th>
                        <th style={{ textAlign: "left", padding: "8px" }}>Hips (cm)</th>
                        <th style={{ textAlign: "left", padding: "8px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeRows.map((row, i) => (
                        <tr key={i}>
                          <td style={{ padding: "4px" }}>
                            <TextField value={row.size} onChange={(v) => updateRow(i, "size", v)} autoComplete="off" />
                          </td>
                          <td style={{ padding: "4px" }}>
                            <TextField value={row.chest} onChange={(v) => updateRow(i, "chest", v)} autoComplete="off" />
                          </td>
                          <td style={{ padding: "4px" }}>
                            <TextField value={row.waist} onChange={(v) => updateRow(i, "waist", v)} autoComplete="off" />
                          </td>
                          <td style={{ padding: "4px" }}>
                            <TextField value={row.hips} onChange={(v) => updateRow(i, "hips", v)} autoComplete="off" />
                          </td>
                          <td style={{ padding: "4px" }}>
                            <Button onClick={() => removeRow(i)} disabled={sizeRows.length <= 1} tone="critical">Remove</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <InlineStack align="center">
                  <Button onClick={addRow}>Add Row</Button>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Template</Text>
                <Grid>
                  {["minimal", "bold", "elegant", "dark"].map(tpl => {
                    const isLocked = isFree && tpl !== "minimal";
                    const isSelected = selectedTemplate === tpl;
                    
                    return (
                      <Grid.Cell key={tpl} columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                        <div 
                          onClick={() => !isLocked && setSelectedTemplate(tpl)}
                          style={{
                            border: isSelected ? "2px solid #005bd3" : "1px solid #e1e3e5",
                            borderRadius: "8px",
                            padding: "16px",
                            cursor: isLocked ? "not-allowed" : "pointer",
                            opacity: isLocked ? 0.6 : 1,
                            position: "relative"
                          }}
                        >
                          {isLocked && (
                            <div style={{ position: "absolute", top: 8, right: 8 }}>
                              <Badge tone="warning">Upgrade</Badge>
                            </div>
                          )}
                          <Text variant="headingSm" as="h3">{tpl.charAt(0).toUpperCase() + tpl.slice(1)}</Text>
                          <div style={{ marginTop: 16, background: "#f4f6f8", padding: 8, borderRadius: 4 }}>
                             <div style={{ height: 40, background: tpl === 'dark' || tpl === 'bold' ? '#333' : '#fff', marginBottom: 8 }} />
                             <div style={{ height: 20, background: tpl === 'elegant' ? '#E8D5C4' : '#e1e3e5' }} />
                          </div>
                        </div>
                      </Grid.Cell>
                    );
                  })}
                </Grid>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Colors</Text>
                {!isPro && (
                  <Banner tone="warning" title="Upgrade to Pro">
                    <p>Upgrade to the Pro plan to customize colors.</p>
                  </Banner>
                )}
                <Grid>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                    <TextField label="Background Color" type="color" value={bgColor} onChange={setBgColor} disabled={!isPro} autoComplete="off" />
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                    <TextField label="Text Color" type="color" value={textColor} onChange={setTextColor} disabled={!isPro} autoComplete="off" />
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                    <TextField label="Button Color" type="color" value={buttonColor} onChange={setButtonColor} disabled={!isPro} autoComplete="off" />
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                    <TextField label="Button Text Color" type="color" value={buttonTextColor} onChange={setButtonTextColor} disabled={!isPro} autoComplete="off" />
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                    <TextField label="Header Background" type="color" value={headerBgColor} onChange={setHeaderBgColor} disabled={!isPro} autoComplete="off" />
                  </Grid.Cell>
                </Grid>
              </BlockStack>
            </Card>
            
            <PageActions
              primaryAction={{
                content: "Save",
                onAction: handleSave,
                loading: isSaving
              }}
            />
          </BlockStack>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Live Preview</Text>
              <Divider />
              <button style={{
                background: isPro ? buttonColor : (selectedTemplate === 'dark' ? '#00FF88' : selectedTemplate === 'bold' ? '#FF4444' : selectedTemplate === 'elegant' ? '#C49A6C' : '#000'),
                color: isPro ? buttonTextColor : (selectedTemplate === 'dark' ? '#000' : '#fff'),
                padding: "10px 20px",
                border: "none",
                borderRadius: selectedTemplate === 'elegant' ? "20px" : selectedTemplate === 'dark' ? "6px" : "4px",
                cursor: "pointer",
                fontFamily: selectedTemplate === 'elegant' ? "Georgia, serif" : selectedTemplate === 'dark' ? "monospace" : "sans-serif"
              }}>
                {buttonText}
              </button>
              
              <div style={{
                background: isPro ? bgColor : (selectedTemplate === 'dark' ? '#0D0D0D' : selectedTemplate === 'bold' ? '#1A1A1A' : selectedTemplate === 'elegant' ? '#FDF6F0' : '#FFF'),
                color: isPro ? textColor : (selectedTemplate === 'dark' ? '#FFF' : selectedTemplate === 'bold' ? '#FFF' : selectedTemplate === 'elegant' ? '#5C4033' : '#000'),
                padding: "16px",
                borderRadius: selectedTemplate === 'elegant' ? "20px" : selectedTemplate === 'dark' ? "6px" : "4px",
                border: `1px solid ${selectedTemplate === 'dark' ? '#00FF88' : selectedTemplate === 'bold' ? '#FF4444' : selectedTemplate === 'elegant' ? '#E8D5C4' : '#E0E0E0'}`,
                fontFamily: selectedTemplate === 'elegant' ? "Georgia, serif" : selectedTemplate === 'dark' ? "monospace" : "sans-serif"
              }}>
                <Text as="h3" variant="headingSm">Size Guide</Text>
                <div style={{ marginTop: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: isPro ? headerBgColor : (selectedTemplate === 'dark' ? '#001A0D' : selectedTemplate === 'bold' ? '#FF4444' : selectedTemplate === 'elegant' ? '#E8D5C4' : '#F5F5F5') }}>
                        <th style={{ padding: 4 }}>Size</th>
                        <th style={{ padding: 4 }}>Chest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeRows.slice(0, 2).map((r, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${selectedTemplate === 'dark' ? '#00FF88' : selectedTemplate === 'bold' ? '#FF4444' : selectedTemplate === 'elegant' ? '#E8D5C4' : '#E0E0E0'}` }}>
                          <td style={{ padding: 4 }}>{r.size}</td>
                          <td style={{ padding: 4 }}>{r.chest}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
