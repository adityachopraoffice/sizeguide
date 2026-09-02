export const meta = () => {
  return [
    { title: "Privacy Policy | Size Guide Pro" },
    { name: "description", content: "Privacy Policy for Size Guide Pro" },
  ];
};

export default function Privacy() {
  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "3rem 1.5rem",
      color: "#333",
      lineHeight: "1.6"
    }}>
      <a href="/" style={{
        color: "#6366f1",
        textDecoration: "none",
        fontWeight: "600",
        marginBottom: "2rem",
        display: "inline-block"
      }}>← Back to App</a>
      
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#111" }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: "3rem" }}>Last updated: September 2, 2026</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#111" }}>1. Information We Collect</h2>
          <p>
            When you install the Size Guide Pro app, we automatically access certain types of information from your Shopify account:
          </p>
          <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
            <li>Store information (Shop domain)</li>
            <li>Basic profile information</li>
            <li>Product and order data required for the app to function properly</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#111" }}>2. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
            <li>To provide and operate the Size Guide Pro service</li>
            <li>To bill you for the service via Shopify's billing API</li>
            <li>To improve and customize our services</li>
            <li>To communicate with you regarding updates or support</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#111" }}>3. Data Sharing and Security</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our application, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#111" }}>4. Your Rights</h2>
          <p>
            You can uninstall the app at any time through your Shopify admin panel. Upon uninstallation, we will automatically delete your store's data from our active databases in compliance with Shopify's data retention policies.
          </p>
        </section>
        
        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#111" }}>5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at support@sizeguidepro.com.
          </p>
        </section>
      </div>
    </div>
  );
}
