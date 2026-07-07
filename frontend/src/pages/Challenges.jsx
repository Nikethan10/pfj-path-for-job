import { useState, useEffect } from 'react';
import { toast } from '../lib/toast';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { getChallenges, getChallengeDetails, markChallengeComplete, generateChallenge } from '../services/challengeService';
import Loader from '../components/Loader';

const PISTON_RUNTIMES = {
  javascript: { language: 'javascript', version: '18.15.0' },
  python: { language: 'python', version: '3.10.0' }
};

// Free public code-execution API (no key required).
const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

// Find the function the user actually defined, so the test harness calls the right
// thing (AI-generated challenges use `solution`, catalog ones use camelCase ids).
const detectFunctionName = (src, lang) => {
  if (lang === 'javascript') {
    const m =
      src.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/) ||
      src.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/);
    return m ? m[1] : null;
  }
  const m = src.match(/def\s+([A-Za-z_]\w*)\s*\(/);
  return m ? m[1] : null;
};

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleGenerateAIChallenge = async () => {
    setGeneratingAI(true);
    try {
      const res = await generateChallenge();
      const challenge = res.data;
      
      // Load it into the active workspace view immediately
      setActiveChallenge(challenge);
      setCode(challenge.initial_code[language] || '');
      setOutput(null);
      setTestResults(null);
    } catch (err) {
      console.error(err);
      toast.error('Could not generate an AI coding challenge right now. Please try again in a moment.');
    } finally {
      setGeneratingAI(false);
    }
  };

  useEffect(() => {
    loadCatalog();

    const handleRefresh = () => {
      loadCatalog();
    };
    window.addEventListener('PATH_refresh_data', handleRefresh);
    return () => window.removeEventListener('PATH_refresh_data', handleRefresh);
  }, []);

  const loadCatalog = async () => {
    try {
      const res = await getChallenges();
      setChallenges(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filteredChallenges = difficultyFilter === 'All' 
    ? challenges 
    : challenges.filter(c => c.difficulty === difficultyFilter);

  const selectChallenge = async (id) => {
    setLoading(true);
    try {
      const res = await getChallengeDetails(id);
      setActiveChallenge(res.data);
      setCode(res.data.initial_code[language] || '');
      setOutput(null);
      setTestResults(null);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (activeChallenge) {
      setCode(activeChallenge.initial_code[lang] || '');
    }
  };

  const handleRunCode = async (runTests = false) => {
    if (!code.trim() || !activeChallenge) return;
    setIsRunning(true);
    setOutput(null);
    setTestResults(null);

    // Prefer the function the user actually wrote; fall back to the id-derived name.
    const fallbackName = language === 'javascript'
      ? activeChallenge.id.split('-').map((p, idx) => idx === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)).join('')
      : activeChallenge.id.replace(/-/g, '_');
    const funcName = detectFunctionName(code, language) || fallbackName;

    let codeToRun = code;

    // If running tests, append assertions
    if (runTests) {
      const tests = activeChallenge.test_cases;
      if (language === 'javascript') {
        let testBlock = '\n\n// --- TEST EXECUTION ---\n';
        tests.forEach((tc, i) => {
          testBlock += `try {
            const res = ${funcName}(${tc.input});
            const expected = ${tc.expected};
            if (JSON.stringify(res) === JSON.stringify(expected)) {
              console.log("TEST ${i+1}: PASS");
            } else {
              console.log("TEST ${i+1}: FAIL (Expected " + JSON.stringify(expected) + " but got " + JSON.stringify(res) + ")");
            }
          } catch(e) { console.log("TEST ${i+1}: ERROR (" + e.message + ")"); }\n`;
        });
        codeToRun += testBlock;
      } else if (language === 'python') {
        let testBlock = '\n\n# --- TEST EXECUTION ---\n';
        tests.forEach((tc, i) => {
          testBlock += `try:\n    res = ${funcName}(${tc.input})\n    expected = ${tc.expected}\n    if str(res) == str(expected):\n        print("TEST ${i+1}: PASS")\n    else:\n        print(f"TEST ${i+1}: FAIL (Expected {expected} but got {res})")\nexcept Exception as e:\n    print(f"TEST ${i+1}: ERROR ({str(e)})")\n`;
        });
        codeToRun += testBlock;
      }
    }

    try {
      let resultText = "";

      if (language === 'javascript') {
        // JavaScript runs locally in the browser — instant feedback, works offline.
        try {
          const mockLog = [];
          const customConsole = { log: (...args) => mockLog.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')) };
          const executeFn = new Function('console', codeToRun);
          executeFn(customConsole);

          if (!runTests && mockLog.length === 0) {
            resultText = "Execution finished successfully. No output.";
          } else {
            resultText = mockLog.join("\n");
          }
        } catch (execErr) {
          resultText = "Error: " + execErr.message;
        }
      } else {
        // Python runs for real on the free Piston execution API.
        const pistonRes = await axios.post(PISTON_URL, {
          language: PISTON_RUNTIMES[language].language,
          version: PISTON_RUNTIMES[language].version,
          files: [{ content: codeToRun }],
        }, { timeout: 20000 });

        const run = pistonRes.data?.run || {};
        resultText = [run.stdout, run.stderr].filter(Boolean).join('\n').trim();
        if (!resultText) {
          resultText = run.code === 0
            ? "Execution finished successfully. No output."
            : "Execution failed with no output.";
        }
      }

      setOutput(resultText);

      if (runTests) {
        const passes = (resultText.match(/: PASS/g) || []).length;
        const total = activeChallenge.test_cases.length;
        setTestResults({ passes, total });

        // Only record completion for a genuine full pass.
        if (total > 0 && passes === total) {
          markChallengeComplete(activeChallenge.id);
        }
      }
    } catch (err) {
      setOutput(
        language === 'python'
          ? 'Error: could not reach the code execution service (Piston). Check your connection and try again.'
          : 'Error executing code: ' + err.message
      );
    }
    setIsRunning(false);
  };

  if (loading && !activeChallenge && challenges.length === 0) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] flex flex-col">
      {!activeChallenge ? (
        // Catalog View
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="section-title text-3xl mb-1"> Coding Challenges</h1>
              <p className="text-slate-500">
                Personalized practice for <span className="text-neon-cyan font-bold">{challenges[0]?.recommended_for || 'your career path'}</span>.
              </p>
            </div>
            
            {/* AI Generator Button & Difficulty Tabs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleGenerateAIChallenge}
                disabled={generatingAI}
                className="btn-primary py-2 px-4 text-sm disabled:opacity-50 shadow-sm flex items-center gap-2"
              >
                {generatingAI ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Generating Challenge...</span>
                  </>
                ) : (
                  <>
                    <span> AI Challenge Generator</span>
                  </>
                )}
              </button>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-dark-700">
                {['All', 'Easy', 'Medium', 'Hard'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDifficultyFilter(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      difficultyFilter === tab 
                        ? 'bg-white text-neon-cyan shadow-sm border border-neon-cyan/20' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Catalog Grid */}
          {filteredChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((c, i) => (
                <motion.div 
                  key={c.id} 
                  onClick={() => selectChallenge(c.id)}
                  className="glass-card bg-white border border-dark-700 hover:border-neon-cyan/50 cursor-pointer transition-all group relative overflow-hidden flex flex-col shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-2">
                      <h3 className="font-bold text-xl text-slate-800 group-hover:text-neon-cyan transition-colors">{c.title}</h3>
                      <span className="text-[10px] uppercase tracking-widest text-neon-purple font-bold">Recommended for {c.recommended_for}</span>
                    </div>

                    <div className="mb-4">
                      <span className={`badge ${
                        c.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-700' :
                        c.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-700' :
                        'bg-rose-500/10 text-rose-700'
                      }`}>
                        {c.difficulty}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">{c.description}</p>

                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-dark-700">
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded border border-dark-700">{c.category}</span>
                      <span className="text-neon-cyan text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        Solve Challenge ➜
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <span className="mb-4 text-slate-300"><svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg></span>
              <p>No {difficultyFilter.toLowerCase()} challenges found.</p>
            </div>
          )}
        </div>

      ) : (
        // Workspace View
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Panel: Description */}
          <div className="w-1/3 flex flex-col gap-4 overflow-hidden">
            <div className="glass-card flex-1 overflow-y-auto">
              <button 
                onClick={() => setActiveChallenge(null)}
                className="text-slate-600 hover:text-slate-800 text-sm mb-4 flex items-center gap-2 font-semibold"
              >
                ← Back to Catalog
              </button>
              
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-900">{activeChallenge.title}</h2>
                <span className={`badge ${activeChallenge.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-700' : activeChallenge.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-700' : 'bg-rose-500/10 text-rose-700'}`}>
                  {activeChallenge.difficulty}
                </span>
              </div>
              
              <div className="prose prose-sm max-w-none text-slate-700">
                {activeChallenge.description.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-slate-900 mb-3">Test Cases</h3>
                <div className="space-y-3">
                  {activeChallenge.test_cases.map((tc, i) => (
                    <div key={i} className="bg-slate-50 border border-dark-700 p-3 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Input:</p>
                      <code className="text-sm text-neon-cyan font-semibold">{tc.input}</code>
                      <p className="text-xs text-slate-500 mt-2 mb-1">Expected Output:</p>
                      <code className="text-sm text-neon-purple font-semibold">{tc.expected}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Editor & Terminal */}
          <div className="w-2/3 flex flex-col gap-4 overflow-hidden">
            <div className="glass-card p-0 flex flex-col h-2/3 overflow-hidden border border-dark-700 bg-white">
              <div className="flex justify-between items-center p-3 border-b border-dark-700 bg-slate-50">
                <select 
                  className="bg-white border border-dark-700 rounded px-3 py-1 text-sm text-slate-800 outline-none cursor-pointer"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python (3.10)</option>
                </select>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRunCode(false)} 
                    disabled={isRunning}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-dark-700 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Run Code
                  </button>
                  <button 
                    onClick={() => handleRunCode(true)} 
                    disabled={isRunning}
                    className="bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-opacity shadow-sm"
                  >
                    {isRunning ? 'Running...' : 'Submit Tests'}
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={language}
                  theme="light"
                  value={code}
                  onChange={(value) => setCode(value)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                  }}
                />
              </div>
            </div>

            {/* Terminal Output */}
            <div className="glass-card h-1/3 flex flex-col overflow-hidden bg-white border border-dark-700 p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Console Output</h3>
                {testResults && (
                  <span className={`text-sm font-bold ${testResults.passes === testResults.total ? 'text-green-700' : 'text-red-700'}`}>
                    {testResults.passes}/{testResults.total} Tests Passed
                  </span>
                )}
              </div>
              <div className="flex-1 bg-slate-50 border border-dark-700 rounded-lg p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                {output === null ? (
                  <span className="text-slate-400">Run your code to see output here...</span>
                ) : (
                  <span className={output.includes('Error') || output.includes('FAIL') ? 'text-red-600' : 'text-slate-800'}>
                    {output}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
