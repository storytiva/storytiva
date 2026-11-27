import { requestMagicLink } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page-shell">
      <section className="welcome-card auth-card">
        <a className="wordmark" href="/">Storytiva</a>
        <p className="eyebrow">Acceso privado · Private workspace</p>
        <h1>Entra a tu taller.</h1>
        <p className="intro">Te enviaremos un enlace de acceso a tu correo.</p>
        <form action={requestMagicLink} className="stack-form">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <button type="submit">Enviar enlace de acceso</button>
        </form>
        {params.sent && <p className="notice" role="status">Revisa tu correo para continuar.</p>}
        {params.error && (
          <p className="notice error" role="alert">
            No pudimos enviar el enlace. Revisa el correo e inténtalo de nuevo.
          </p>
        )}
      </section>
    </main>
  );
}
