import PublicPage from '../components/PublicPage';

const SUPPORT_EMAIL = 'support@pathforjob.example';

export default function Contact() {
  return (
    <PublicPage title="Contact us" subtitle="We'd love to hear from you.">
      <p>
        Questions, feedback, or a bug to report? Reach the PATH team and we'll get back to you as soon as we can.
      </p>

      <div className="not-prose grid gap-4 sm:grid-cols-2 my-6">
        <div className="glass-card">
          <h3 className="font-semibold text-slate-800">General &amp; support</h3>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-neon-cyan hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div className="glass-card">
          <h3 className="font-semibold text-slate-800">Response time</h3>
          <p className="text-sm text-slate-500">Typically within 1–2 business days.</p>
        </div>
      </div>

      <p className="text-sm text-slate-400">
        Note: the address above is a placeholder. Replace it with your real support contact before launch.
      </p>
    </PublicPage>
  );
}
