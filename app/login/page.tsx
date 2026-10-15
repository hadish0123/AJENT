import LoginForm from "./login-form";

function safeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const query = await searchParams;
  const returnTo = safeReturnTo(query.returnTo);

  return (
    <main className="loginShell">
      <section className="loginCard">
        <div className="brand loginBrand">
          <span className="brandMark">H</span>
          <span>
            <strong>HADI</strong>
            <small>DEV STUDIO</small>
          </span>
        </div>
        <span className="eyebrow">PRIVATE CONTROL PLANE</span>
        <h1>Authenticated access only.</h1>
        <p>
          Owner sessions can build and mutate projects. Auditor sessions are read-only.
        </p>
        <LoginForm returnTo={returnTo} />
      </section>
    </main>
  );
}
