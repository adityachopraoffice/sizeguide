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
  PageActions,
  Icon
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
      shopify.toast.show("Settings saved successfully", { duration: 3000 });
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
    <Page 
      title="Size Guide Settings" 
      subtitle="Customize the look, feel, and content of your size charts"
    >
      <Layout>
        {/* Left Column - Configuration */}
        <Layout.Section>
          <BlockStack gap="800">
            
            {/* DATA SECTION */}
            <Layout.AnnotatedSection
              title="Size Chart Data"
              description="Define the measurements for your products. You can add or remove sizes to fit your specific inventory."
            >
              <Card>
                <BlockStack gap="400">
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                          <th style={{ textAlign: "left", padding: "12px 8px", color: "#6d7175" }}>Size Label</th>
                          <th style={{ textAlign: "left", padding: "12px 8px", color: "#6d7175" }}>Chest (cm)</th>
                          <th style={{ textAlign: "left", padding: "12px 8px", color: "#6d7175" }}>Waist (cm)</th>
                          <th style={{ textAlign: "left", padding: "12px 8px", color: "#6d7175" }}>Hips (cm)</th>
                          <th style={{ textAlign: "left", padding: "12px 8px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeRows.map((row, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f4f6f8" }}>
                            <td style={{ padding: "8px" }}>
                              <TextField value={row.size} onChange={(v) => updateRow(i, "size", v)} autoComplete="off" />
                            </td>
                            <td style={{ padding: "8px" }}>
                              <TextField value={row.chest} onChange={(v) => updateRow(i, "chest", v)} autoComplete="off" />
                            </td>
                            <td style={{ padding: "8px" }}>
                              <TextField value={row.waist} onChange={(v) => updateRow(i, "waist", v)} autoComplete="off" />
                            </td>
                            <td style={{ padding: "8px" }}>
                              <TextField value={row.hips} onChange={(v) => updateRow(i, "hips", v)} autoComplete="off" />
                            </td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>
                              <Button variant="tertiary" onClick={() => removeRow(i)} disabled={sizeRows.length <= 1} tone="critical">✕</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Box paddingBlockStart="200">
                    <Button onClick={addRow} size="large">Add New Row</Button>
                  </Box>
                </BlockStack>
              </Card>
            </Layout.AnnotatedSection>

            <Divider />

            {/* BUTTON SECTION */}
            <Layout.AnnotatedSection
              title="Storefront Button"
              description="Customize the text of the button that customers will click to open the size guide popup."
            >
              <Card>
                <BlockStack gap="400">
                  {isFree ? (
                    <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <Text as="h3" variant="headingSm">Button Text</Text>
                          <Badge tone="info">Basic Plan Feature</Badge>
                        </InlineStack>
                        <TextField 
                          value={buttonText} 
                          disabled 
                          autoComplete="off" 
                        />
                        <Text tone="subdued" as="p">Upgrade to Basic or Pro to customize the storefront button text.</Text>
                      </BlockStack>
                    </Box>
                  ) : (
                    <TextField 
                      label="Button Text" 
                      value={buttonText} 
                      onChange={setButtonText} 
                      autoComplete="off"
                      helpText="e.g., 'Find Your Size', 'Size Guide', 'Fit Details'"
                    />
                  )}
                </BlockStack>
              </Card>
            </Layout.AnnotatedSection>

            <Divider />

            {/* TEMPLATE SECTION */}
            <Layout.AnnotatedSection
              title="Template Style"
              description="Choose a base template that best matches your store's aesthetic. Each template provides unique fonts, border radiuses, and shadow styles."
            >
              <Card>
                <Grid>
                  {[
                    { id: "minimal", name: "Minimal", desc: "Clean and sharp edges" },
                    { id: "bold", name: "Bold", desc: "High contrast UI" },
                    { id: "elegant", name: "Elegant", desc: "Serif fonts & rounded" },
                    { id: "dark", name: "Dark Mode", desc: "Sleek and modern" }
                  ].map(tpl => {
                    const isLocked = isFree && tpl.id !== "minimal";
                    const isSelected = selectedTemplate === tpl.id;
                    
                    return (
                      <Grid.Cell key={tpl.id} columnSpan={{xs: 6, sm: 6, md: 6, lg: 6, xl: 6}}>
                        <div 
                          onClick={() => !isLocked && setSelectedTemplate(tpl.id)}
                          style={{
                            border: isSelected ? "2px solid #005bd3" : "1px solid #e1e3e5",
                            borderRadius: "12px",
                            padding: "20px",
                            cursor: isLocked ? "not-allowed" : "pointer",
                            background: isSelected ? "#f4f8fd" : "#fff",
                            opacity: isLocked ? 0.6 : 1,
                            position: "relative",
                            transition: "all 0.2s ease",
                            height: "100%"
                          }}
                        >
                          {isLocked && (
                            <div style={{ position: "absolute", top: 12, right: 12 }}>
                              <Badge tone="warning">Premium</Badge>
                            </div>
                          )}
                          <BlockStack gap="100">
                            <Text variant="headingMd" as="h3">{tpl.name}</Text>
                            <Text variant="bodySm" tone="subdued">{tpl.desc}</Text>
                          </BlockStack>
                          
                          {/* Mini Mockup */}
                          <div style={{ 
                            marginTop: 20, 
                            background: tpl.id === 'dark' || tpl.id === 'bold' ? '#111' : tpl.id === 'elegant' ? '#FDF6F0' : '#f4f6f8', 
                            padding: 12, 
                            borderRadius: tpl.id === 'elegant' ? 12 : 6,
                            border: `1px solid ${tpl.id === 'dark' ? '#00FF88' : '#e1e3e5'}`
                          }}>
                             <div style={{ height: 24, background: tpl.id === 'dark' ? '#001A0D' : tpl.id === 'bold' ? '#FF4444' : tpl.id === 'elegant' ? '#E8D5C4' : '#fff', marginBottom: 8, borderRadius: 4 }} />
                             <div style={{ height: 12, background: tpl.id === 'elegant' ? '#E8D5C4' : '#e1e3e5', width: '60%', borderRadius: 4 }} />
                          </div>
                        </div>
                      </Grid.Cell>
                    );
                  })}
                </Grid>
              </Card>
            </Layout.AnnotatedSection>

            <Divider />

            {/* COLOR SECTION */}
            <Layout.AnnotatedSection
              title="Brand Colors"
              description="Override the template's default colors to perfectly match your brand's unique identity."
            >
              <Card>
                <BlockStack gap="400">
                  {!isPro && (
                    <Banner tone="info" title="Pro Plan Feature">
                      <p>Full color customization is unlocked on the Pro plan. Your Size Guide will use the optimized default colors for your selected template until you upgrade.</p>
                    </Banner>
                  )}
                  
                  <div style={{ opacity: isPro ? 1 : 0.5, pointerEvents: isPro ? 'auto' : 'none' }}>
                    <Grid>
                      {[
                        { label: "Background", value: bgColor, setter: setBgColor },
                        { label: "Text", value: textColor, setter: setTextColor },
                        { label: "Button Background", value: buttonColor, setter: setButtonColor },
                        { label: "Button Text", value: buttonTextColor, setter: setButtonTextColor },
                        { label: "Header Background", value: headerBgColor, setter: setHeaderBgColor },
                      ].map((colorObj, idx) => (
                        <Grid.Cell key={idx} columnSpan={{xs: 6, sm: 6, md: 4, lg: 4, xl: 4}}>
                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">{colorObj.label}</Text>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <input 
                                type="color" 
                                value={colorObj.value} 
                                onChange={(e) => colorObj.setter(e.target.value)}
                                style={{ width: "40px", height: "40px", padding: "0", border: "1px solid #c9cccf", borderRadius: "4px", cursor: "pointer" }}
                              />
                              <TextField 
                                value={colorObj.value} 
                                onChange={colorObj.setter} 
                                autoComplete="off" 
                              />
                            </div>
                          </BlockStack>
                        </Grid.Cell>
                      ))}
                    </Grid>
                  </div>
                </BlockStack>
              </Card>
            </Layout.AnnotatedSection>
            
          </BlockStack>
        </Layout.Section>
        
        {/* Right Column - Sticky Preview */}
        <Layout.Section variant="oneThird">
          <div style={{ position: "sticky", top: "20px" }}>
            <Card padding="0">
              <Box padding="400" borderBottom="1px solid #e1e3e5" background="bg-surface-secondary">
                <Text variant="headingMd" as="h2" alignment="center">Live Preview</Text>
              </Box>
              
              <Box padding="600" background="bg-surface-tertiary">
                <BlockStack gap="400" align="center" inlineAlign="center">
                  
                  {/* Storefront Mockup Container */}
                  <div style={{
                    background: "#fff",
                    width: "100%",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    border: "1px solid #e1e3e5"
                  }}>
                    {/* Mock Browser Header */}
                    <div style={{ background: "#f4f6f8", padding: "12px", borderBottom: "1px solid #e1e3e5", display: "flex", gap: "6px" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: "#ff5f56" }} />
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: "#ffbd2e" }} />
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: "#27c93f" }} />
                    </div>
                    
                    {/* Mock Page Body */}
                    <div style={{ padding: "30px 20px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      
                      {/* Button */}
                      <button style={{
                        background: isPro ? buttonColor : (selectedTemplate === 'dark' ? '#00FF88' : selectedTemplate === 'bold' ? '#FF4444' : selectedTemplate === 'elegant' ? '#C49A6C' : '#000'),
                        color: isPro ? buttonTextColor : (selectedTemplate === 'dark' ? '#000' : '#fff'),
                        padding: "12px 24px",
                        border: "none",
                        borderRadius: selectedTemplate === 'elegant' ? "30px" : selectedTemplate === 'dark' ? "6px" : "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        fontFamily: selectedTemplate === 'elegant' ? "Georgia, serif" : selectedTemplate === 'dark' ? "monospace" : "sans-serif",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        width: "100%",
                        marginBottom: "20px"
                      }}>
                        {buttonText}
                      </button>
                      
                      {/* Popup Preview */}
                      <div style={{
                        background: isPro ? bgColor : (selectedTemplate === 'dark' ? '#0D0D0D' : selectedTemplate === 'bold' ? '#1A1A1A' : selectedTemplate === 'elegant' ? '#FDF6F0' : '#FFF'),
                        color: isPro ? textColor : (selectedTemplate === 'dark' ? '#FFF' : selectedTemplate === 'bold' ? '#FFF' : selectedTemplate === 'elegant' ? '#5C4033' : '#000'),
                        borderRadius: selectedTemplate === 'elegant' ? "20px" : selectedTemplate === 'dark' ? "8px" : "6px",
                        border: `1px solid ${selectedTemplate === 'dark' ? '#00FF88' : selectedTemplate === 'bold' ? '#FF4444' : selectedTemplate === 'elegant' ? '#E8D5C4' : '#E0E0E0'}`,
                        fontFamily: selectedTemplate === 'elegant' ? "Georgia, serif" : selectedTemplate === 'dark' ? "monospace" : "sans-serif",
                        width: "100%",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                      }}>
                        
                        <div style={{
                          background: isPro ? headerBgColor : (selectedTemplate === 'dark' ? '#001A0D' : selectedTemplate === 'bold' ? '#FF4444' : selectedTemplate === 'elegant' ? '#E8D5C4' : '#F5F5F5'),
                          padding: "16px",
                          borderTopLeftRadius: "inherit",
                          borderTopRightRadius: "inherit",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span style={{ fontWeight: "bold", fontSize: "16px" }}>Size Guide</span>
                          <span style={{ opacity: 0.5 }}>✕</span>
                        </div>
                        
                        <div style={{ padding: "16px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", paddingBottom: "8px", opacity: 0.7 }}>Size</th>
                                <th style={{ textAlign: "left", paddingBottom: "8px", opacity: 0.7 }}>Chest</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sizeRows.slice(0, 3).map((r, i) => (
                                <tr key={i} style={{ borderTop: `1px solid ${selectedTemplate === 'dark' ? 'rgba(0,255,136,0.2)' : 'rgba(0,0,0,0.1)'}` }}>
                                  <td style={{ padding: "10px 0", fontWeight: "bold" }}>{r.size || "-"}</td>
                                  <td style={{ padding: "10px 0" }}>{r.chest || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </BlockStack>
              </Box>
            </Card>
            
            <Box paddingBlockStart="400">
              <PageActions
                primaryAction={{
                  content: "Save Configuration",
                  onAction: handleSave,
                  loading: isSaving
                }}
              />
            </Box>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
