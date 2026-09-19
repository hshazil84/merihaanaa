const BG = "#F5F3EF";
const TEXT = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(90,88,82)";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: TEXT, marginBottom: "0.75rem" }}>{title}</h2>
      <div style={{ fontSize: "14px", color: TEXT_MUTED, lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }}>
      <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: TEXT, marginBottom: "0.5rem" }}>Privacy Policy</h1>
        <p style={{ fontSize: "13px", color: TEXT_MUTED, marginBottom: "2.5rem" }}>
          Last updated: [DATE]
        </p>

        <Section title="Overview">
          <p>
            This Privacy Policy explains how [MERIHAANAA / LEGAL ENTITY NAME] ("we," "us," or "our")
            collects, uses, and protects information when you visit merihaanaa.com (the "Site").
          </p>
        </Section>

        <Section title="Information We Collect">
          <p style={{ marginBottom: "0.75rem" }}>
            <strong>Newsletter subscription.</strong> If you subscribe to our newsletter, we collect
            the email address you provide.
          </p>
          <p style={{ marginBottom: "0.75rem" }}>
            <strong>Usage data.</strong> [If analytics are installed: We use [ANALYTICS PROVIDER] to
            collect anonymized usage data such as pages visited, referring sites, device type, and
            approximate location, to help us understand how the Site is used.]
          </p>
          <p>
            <strong>Content and media.</strong> Articles, images, and video are served through
            Supabase (database and storage) and Cloudflare (image and video delivery). These providers
            may log standard technical data (such as IP address) as part of delivering content.
          </p>
        </Section>

        <Section title="How We Use Information">
          <ul style={{ paddingInlineStart: "1.25rem", listStyle: "disc" }}>
            <li>To send the newsletter to subscribers who opt in</li>
            <li>To operate, maintain, and improve the Site</li>
            <li>To understand aggregate readership and usage patterns</li>
            <li>To respond to inquiries sent to our contact address</li>
          </ul>
        </Section>

        <Section title="Third-Party Services">
          <p>We rely on the following third-party services to operate the Site:</p>
          <ul style={{ paddingInlineStart: "1.25rem", listStyle: "disc", marginTop: "0.5rem" }}>
            <li>Supabase — database, authentication, and file storage</li>
            <li>Cloudflare — image delivery (R2) and video streaming (Stream)</li>
            <li>Vercel — hosting and deployment</li>
            <li>[EMAIL/NEWSLETTER PROVIDER, if any]</li>
            <li>[ANALYTICS PROVIDER, if any]</li>
          </ul>
          <p style={{ marginTop: "0.75rem" }}>
            Each of these providers processes data under their own privacy policies.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            [Describe actual cookie usage here — e.g., "The Site uses only essential cookies required
            for its operation" or, if analytics/ads are present, "The Site uses cookies for analytics
            and advertising purposes; see [Cookie Policy link] for details."]
          </p>
        </Section>

        <Section title="Data Retention">
          <p>
            We retain newsletter subscriber email addresses until a subscriber unsubscribes or
            requests deletion. [Add any other specific retention practices.]
          </p>
        </Section>

        <Section title="Your Rights">
          <p>
            You may request access to, correction of, or deletion of your personal data by contacting
            us at [CONTACT EMAIL]. You can unsubscribe from the newsletter at any time using the link
            in any newsletter email[, or by request if no unsubscribe link is currently implemented].
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            The Site is not directed at children, and we do not knowingly collect personal information
            from children.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated "Last updated" date.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            Questions about this Privacy Policy can be sent to [CONTACT EMAIL] [or postal address, if
            required in your jurisdiction].
          </p>
        </Section>
      </div>
    </div>
  );
}
