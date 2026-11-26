export default function Home() {
  return (
    <main className="page-shell">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="wordmark">Storytiva</p>
        <p className="eyebrow">Tu taller de escritura � Your writing studio</p>
        <h1 id="welcome-title">Vuelve a escribir sin volver a organizarlo todo.</h1>
        <p className="intro">
          Get back to your book, pick up where you left off, and keep your ideas close.
        </p>
        <div className="status" role="status">
          El taller est� tomando forma. <span>The writing studio is taking shape.</span>
        </div>
      </section>
    </main>
  );
}

