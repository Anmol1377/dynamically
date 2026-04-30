import { dynamicallyForNext } from '@anmollabs/dynamically-client/next';
import { DynamicallyApiError } from '@anmollabs/dynamically-client';

type ImageValue = {
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
};

type HomeSections = {
  hero?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaUrl?: string;
    background?: ImageValue | null;
  };
};

export const revalidate = 60;

export default async function HomePage() {
  let home;
  try {
    const client = dynamicallyForNext();
    home = await client.getPage<HomeSections>('home');
  } catch (e) {
    return <ErrorPanel error={e} />;
  }

  const hero = home.sections.hero ?? {};
  const headline = (hero.headline as string | undefined) ?? home.title;
  const subheadline = hero.subheadline as string | undefined;
  const ctaText = hero.ctaText as string | undefined;
  const ctaUrl = hero.ctaUrl as string | undefined;
  const background = hero.background;
  const baseUrl = process.env.DYNAMICALLY_URL ?? '';

  return (
    <main>
      {background && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`${baseUrl}${background.url}`}
          alt={background.alt}
          className="hero-bg"
        />
      )}
      <section className={background ? 'hero hero-overlay' : 'hero'}>
        <h1>{headline}</h1>
        {subheadline && <p>{subheadline}</p>}
        {ctaText && (
          <a className="cta" href={ctaUrl ?? '#'}>
            {ctaText}
          </a>
        )}
      </section>
      <footer className="footer">
        Powered by Dynamically · last updated{' '}
        <code>{new Date(home.updatedAt).toLocaleString()}</code>
      </footer>
    </main>
  );
}

function ErrorPanel({ error }: { error: unknown }) {
  if (error instanceof DynamicallyApiError) {
    return (
      <div className="error">
        <strong>Could not load /home from Dynamically.</strong>
        <br />
        HTTP {error.status} ({error.code}): {error.message}
        <br />
        Make sure the Dynamically server is running and that <code>home</code> is published.
      </div>
    );
  }
  return (
    <div className="error">
      Unexpected error: {error instanceof Error ? error.message : String(error)}
      <br />
      Did you set <code>DYNAMICALLY_URL</code> and <code>DYNAMICALLY_API_KEY</code>?
    </div>
  );
}
