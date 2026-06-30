import PublicPage from '../components/PublicPage';

export default function Privacy() {
  return (
    <PublicPage title="Privacy Policy" subtitle="Last updated: June 30, 2026">
      <p>
        This Privacy Policy explains what information PFJ — Path For Job (the "Service") collects, how it is
        used, and the choices you have.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">Information we collect</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Account information</strong> — your name and email, provided via Firebase Authentication.</li>
        <li><strong>Profile &amp; activity</strong> — degree, branch, target role, skills, projects, and your in-app activity.</li>
        <li><strong>Content you submit</strong> — resume text/files and job descriptions you choose to analyze.</li>
      </ul>

      <h2 className="text-xl font-bold text-slate-800 pt-2">How we use it</h2>
      <p>
        We use your information to provide the Service's features — readiness scoring, roadmaps, resume analysis,
        interview practice, and achievements — and to improve reliability and security.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">Third-party processors</h2>
      <p>
        We rely on trusted providers to operate the Service, including Google Firebase (authentication and
        database) and AI providers (such as Groq and Google Gemini) used to generate analysis and feedback.
        Content sent for AI analysis is transmitted to those providers to produce your results.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">Data retention &amp; your choices</h2>
      <p>
        Your data is retained while your account is active. You can update your profile at any time and may
        request deletion of your account data by contacting us.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">Security</h2>
      <p>
        We use industry-standard measures — encrypted transport, authentication on every request, and strict
        access controls — to protect your data. No method of transmission or storage is completely secure.
      </p>

      <h2 className="text-xl font-bold text-slate-800 pt-2">Cookies &amp; local storage</h2>
      <p>
        The Service uses browser local storage to keep you signed in. It does not use advertising or
        cross-site tracking cookies.
      </p>

      <p className="text-sm text-slate-400 pt-4">
        This document is a general template and not legal advice. Please have it reviewed by a qualified
        professional and tailored to your jurisdiction before public launch.
      </p>
    </PublicPage>
  );
}
