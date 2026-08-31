function initSizeGuide() {
  const wrapper = document.getElementById("sizeguide-wrapper");
  if (!wrapper) return;
  
  if (wrapper.hasAttribute("data-initialized")) return;
  wrapper.setAttribute("data-initialized", "true");
  
  const shop = wrapper.getAttribute("data-shop");
  if (!shop) return;
  
  console.log("SizeGuide Extension: Initializing for shop", shop);
  
  fetch(`/apps/sizeguide/settings?shop=${shop}`)
    .then(res => res.json())
    .then(settings => {
      console.log("SizeGuide Extension: Settings loaded", settings);
      if (!settings.sizeRows || settings.sizeRows.length === 0) {
        console.log("SizeGuide Extension: No size rows configured");
        return;
      }
      
      const { 
        buttonText, selectedTemplate, bgColor, textColor, 
        buttonColor, buttonTextColor, headerBgColor, currentPlan, sizeRows 
      } = settings;
      
      const isPro = currentPlan === "pro";
      const isBasic = currentPlan === "basic" || currentPlan === "pro";
      
      const templates = {
        minimal: {
          modalBg: "#FFFFFF",
          text: "#000000",
          headerBg: "#F5F5F5",
          border: "1px solid #E0E0E0",
          btnBg: "#000000",
          btnText: "#FFFFFF",
          radius: "4px",
          font: "sans-serif"
        },
        bold: {
          modalBg: "#1A1A1A",
          text: "#FFFFFF",
          headerBg: "#FF4444",
          border: "1px solid #FF4444",
          btnBg: "#FF4444",
          btnText: "#FFFFFF",
          radius: "4px",
          font: "sans-serif"
        },
        elegant: {
          modalBg: "#FDF6F0",
          text: "#5C4033",
          headerBg: "#E8D5C4",
          border: "1px solid #E8D5C4",
          btnBg: "#C49A6C",
          btnText: "#FFFFFF",
          radius: "20px",
          font: "Georgia, serif"
        },
        dark: {
          modalBg: "#0D0D0D",
          text: "#FFFFFF",
          headerBg: "#001A0D",
          border: "1px solid #00FF88",
          btnBg: "#00FF88",
          btnText: "#000000",
          radius: "6px",
          font: "monospace"
        }
      };
      
      const tpl = templates[selectedTemplate] || templates.minimal;
      
      const activeModalBg = isPro ? bgColor : tpl.modalBg;
      const activeText = isPro ? textColor : tpl.text;
      const activeHeaderBg = isPro ? headerBgColor : tpl.headerBg;
      const activeBtnBg = isPro ? buttonColor : tpl.btnBg;
      const activeBtnText = isPro ? buttonTextColor : tpl.btnText;
      const activeBorder = isPro ? `1px solid ${headerBgColor}` : tpl.border;
      
      const btn = document.createElement("button");
      btn.innerText = buttonText;
      btn.style.backgroundColor = activeBtnBg;
      btn.style.color = activeBtnText;
      btn.style.border = "none";
      btn.style.borderRadius = tpl.radius;
      btn.style.padding = "10px 20px";
      btn.style.cursor = "pointer";
      btn.style.fontFamily = tpl.font;
      wrapper.appendChild(btn);
      
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
      overlay.style.zIndex = "9999";
      overlay.style.display = "none";
      
      const modal = document.createElement("div");
      modal.style.margin = "0 auto";
      modal.style.maxWidth = "600px";
      modal.style.width = "90%";
      modal.style.maxHeight = "80vh";
      modal.style.overflowY = "auto";
      modal.style.padding = "24px";
      modal.style.backgroundColor = activeModalBg;
      modal.style.color = activeText;
      modal.style.borderRadius = tpl.radius;
      modal.style.fontFamily = tpl.font;
      
      modal.addEventListener("click", function(e) {
        e.stopPropagation();
      });
      
      const headerDiv = document.createElement("div");
      headerDiv.style.display = "flex";
      headerDiv.style.justifyContent = "space-between";
      headerDiv.style.alignItems = "center";
      headerDiv.style.marginBottom = "16px";
      
      const title = document.createElement("h2");
      title.innerText = "Size Guide";
      title.style.margin = "0";
      title.style.fontSize = "20px";
      
      const closeBtn = document.createElement("button");
      closeBtn.innerText = "X";
      closeBtn.style.background = "none";
      closeBtn.style.border = "none";
      closeBtn.style.fontSize = "20px";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.color = activeText;
      
      headerDiv.appendChild(title);
      headerDiv.appendChild(closeBtn);
      modal.appendChild(headerDiv);
      
      let currentUnit = "CM";
      if (isBasic) {
        const toggleDiv = document.createElement("div");
        toggleDiv.style.marginBottom = "16px";
        
        const btnCM = document.createElement("button");
        btnCM.innerText = "CM";
        btnCM.style.marginRight = "8px";
        btnCM.style.padding = "4px 8px";
        btnCM.style.cursor = "pointer";
        btnCM.style.border = activeBorder;
        btnCM.style.background = activeBtnBg;
        btnCM.style.color = activeBtnText;
        
        const btnIN = document.createElement("button");
        btnIN.innerText = "Inches";
        btnIN.style.padding = "4px 8px";
        btnIN.style.cursor = "pointer";
        btnIN.style.border = activeBorder;
        btnIN.style.background = "transparent";
        btnIN.style.color = activeText;
        
        btnCM.addEventListener("click", () => {
          if (currentUnit === "CM") return;
          currentUnit = "CM";
          btnCM.style.background = activeBtnBg;
          btnCM.style.color = activeBtnText;
          btnIN.style.background = "transparent";
          btnIN.style.color = activeText;
          renderTable();
        });
        
        btnIN.addEventListener("click", () => {
          if (currentUnit === "Inches") return;
          currentUnit = "Inches";
          btnIN.style.background = activeBtnBg;
          btnIN.style.color = activeBtnText;
          btnCM.style.background = "transparent";
          btnCM.style.color = activeText;
          renderTable();
        });
        
        toggleDiv.appendChild(btnCM);
        toggleDiv.appendChild(btnIN);
        modal.appendChild(toggleDiv);
      }
      
      const tableContainer = document.createElement("div");
      modal.appendChild(tableContainer);
      
      const renderTable = () => {
        tableContainer.innerHTML = "";
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headerRow.style.backgroundColor = activeHeaderBg;
        
        ["Size", "Chest", "Waist", "Hips"].forEach(text => {
          const th = document.createElement("th");
          th.innerText = text;
          th.style.padding = "10px";
          th.style.border = activeBorder;
          th.style.textAlign = "left";
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement("tbody");
        sizeRows.forEach(row => {
          const tr = document.createElement("tr");
          
          const convert = (val) => {
            if (!val) return "";
            if (currentUnit === "Inches") {
              const num = parseFloat(val) * 0.394;
              return num.toFixed(1);
            }
            return val;
          };
          
          [row.size, convert(row.chest), convert(row.waist), convert(row.hips)].forEach(val => {
            const td = document.createElement("td");
            td.innerText = val;
            td.style.padding = "10px";
            td.style.border = activeBorder;
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableContainer.appendChild(table);
      };
      
      renderTable();
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      btn.addEventListener("click", () => {
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
      });
      
      closeBtn.addEventListener("click", () => {
        overlay.style.display = "none";
      });
      
      overlay.addEventListener("click", () => {
        overlay.style.display = "none";
      });
      
    })
    .catch(err => console.error("SizeGuide Extension Error:", err));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSizeGuide);
} else {
  initSizeGuide();
}

document.addEventListener("shopify:section:load", initSizeGuide);
