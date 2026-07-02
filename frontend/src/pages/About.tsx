import { Link } from 'react-router-dom';
import PublicPage from '../components/PublicPage';

const STEPS = [
  { n: 1, t: 'Build your profile', d: 'Tell us your degree, branch, and target role so guidance is tailored to you.' },
  { n: 2, t: 'Track skills & roadmap', d: 'Add skills, follow an adaptive learning roadmap, and validate progress with quizzes.' },
  { n: 3, t: 'Sharpen your resume', d: 'Run an ATS-style analysis, match against job descriptions, and rewrite bullet points.' },
  { n: 4, t: 'Practice & apply', d: 'Take mock interviews, solve coding challenges, and find roles that match your skills.' },
];

export default function About() {
  return (
    <PublicPage
      title="How PATH works"
      subtitle="PATH — Placement And Talent Hub — is an AI-driven career intelligence platform that helps students become placement-ready."
    >
      <p>
        Landing a great first role is hard when you don't know what to learn, how your resume reads to a
        recruiter, or where your gaps are. PATH turns that uncertainty into a clear, measurable plan.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 not-prose my-8">
        {STEPS.map((s) => (
          <div key={s.n} className="glass-card">
            <div className="w-9 h-9 rounded-lg bg-neon-cyan/15 text-neon-cyan font-bold flex items-center justify-center mb-3">
              {s.n}
            </div>
            <h3 className="font-semibold text-slate-800">{s.t}</h3>
            <p className="text-sm text-slate-500 mt-1">{s.d}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-slate-800 pt-2">What you get</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>A personalized readiness score that tracks your real progress.</li>
        <li>An adaptive skill roadmap with quizzes to confirm what you've learned.</li>
        <li>An AI resume lab: ATS analysis, job-description matching, and bullet rewriting.</li>
        <li>Mock interviews and coding challenges to practice under realistic conditions.</li>
        <li>Achievements that reward consistent, real effort.</li>
      </ul>

      <div className="not-prose mt-8">
        <Link to="/signup" className="btn-primary inline-block">Get started — it's free</Link>
      </div>
    </PublicPage>
  );
}
