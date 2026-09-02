import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.backgroundGlow}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logo}>Size Guide Pro</div>
          <a href="/privacy" className={styles.privacyLink}>Privacy Policy</a>
        </div>
        
        <h1 className={styles.heading}>The Ultimate Size Guide for Shopify</h1>
        <p className={styles.text}>
          Increase conversions and reduce returns with beautiful, customizable size charts that match your brand perfectly.
        </p>
        
        {showForm && (
          <div className={styles.formCard}>
            <Form className={styles.form} method="post" action="/auth/login">
              <label className={styles.label}>
                <span className={styles.labelText}>Enter your store URL to log in or install:</span>
                <input 
                  className={styles.input} 
                  type="text" 
                  name="shop" 
                  placeholder="e.g. my-store.myshopify.com"
                  required
                />
              </label>
              <button className={styles.button} type="submit">
                Continue to App
              </button>
            </Form>
          </div>
        )}
        
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>Stunning Designs</h3>
            <p>Choose from elegant, bold, minimal, or dark modes. Fully customize colors to match your brand.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>Instant Loading</h3>
            <p>Optimized for ultra-fast loading without impacting your store's performance metrics.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🌐</div>
            <h3>Smart Units</h3>
            <p>Let customers toggle seamlessly between Centimeters and Inches with a single click.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
