import PublicPage from '../components/PublicPage';

export default function Terms() {
  return (
    <PublicPage title="Terms of Use" subtitle="Last updated: June 30, 2026">
      <p>
        These Terms of Use ("Terms") govern your access to and use of PATH — Placement And Talent Hub (the "Service"). By
        creating an account or using the Service, you agree to these Terms.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">1. Eligibility &amp; accounts</h2>
      <p>
        You must provide accurate information when creating an account and are responsible for keeping your
        credentials secure. You are responsible for all activity that occurs under your account.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">2. Acceptable use</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Do not misuse, disrupt, or attempt to gain unauthorized access to the Service or its data.</li>
        <li>Do not upload unlawful content or content that infringes the rights of others.</li>
        <li>Do not attempt to reverse-engineer, scrape, or overload the Service.</li>
      </ul>

      <h2 className="text-xl font-bold text-slate-800 pt-2">3. Your content</h2>
      <p>
        You retain ownership of the resumes, profile details, and other content you submit. You grant PATH a
        limited license to process that content solely to provide the Service's features to you.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">4. AI-generated guidance</h2>
      <p>
        The Service provides automated analysis, scores, and recommendations for informational purposes only.
        They are not guarantees of employment or outcomes, and you should use your own judgment.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">5. Service availability</h2>
      <p>
        The Service is provided "as is" without warranties of any kind. We may modify, suspend, or discontinue
        features at any time.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, PATH is not liable for any indirect, incidental, or consequential
        damages arising from your use of the Service.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">7. Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service after changes take effect
        constitutes acceptance of the updated Terms.
      </p>

      <p className="text-sm text-slate-400 pt-4">
        This document is a general template and not legal advice. Please have it reviewed by a qualified
        professional and tailored to your jurisdiction before public launch.
      </p>
    </PublicPage>
  );
}
