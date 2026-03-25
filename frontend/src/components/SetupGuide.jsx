/**
 * Short workshop checklist (run backend + frontend, optional env).
 */
export default function SetupGuide() {
  return (
    <section className="setup-guide" aria-label="Workshop setup">
      <p className="setup-guide-title">Run locally</p>
      <ol className="setup-guide-list">
        <li>
          <code>cd backend</code> → <code>pip install -r requirements.txt</code> →{" "}
          <code>python app.py</code>
        </li>
        <li>
          <code>cd frontend</code> → <code>npm install</code> →{" "}
          <code>npm run dev</code>
        </li>
      </ol>
      <p className="setup-guide-note">
        Env templates: see repository <code>.env.example</code> (copy into{" "}
        <code>backend/.env</code> if needed).
      </p>
    </section>
  );
}
