import { json } from "@remix-run/node";
import prisma from "../db.server.js";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { 
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }

  let settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    settings = {
      buttonText: "Size Guide",
      selectedTemplate: "minimal",
      bgColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#000000",
      buttonTextColor: "#FFFFFF",
      headerBgColor: "#F5F5F5",
      currentPlan: "free",
      sizeRows: '[{"size":"S","chest":"36","waist":"28","hips":"38"},{"size":"M","chest":"38","waist":"30","hips":"40"}]'
    };
  }

  const response = {
    buttonText: settings.buttonText,
    selectedTemplate: settings.selectedTemplate,
    bgColor: settings.bgColor,
    textColor: settings.textColor,
    buttonColor: settings.buttonColor,
    buttonTextColor: settings.buttonTextColor,
    headerBgColor: settings.headerBgColor,
    currentPlan: settings.currentPlan,
    sizeRows: JSON.parse(settings.sizeRows || "[]")
  };

  return json(response, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}
