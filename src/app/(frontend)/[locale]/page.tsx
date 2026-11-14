// Page témoin du socle (T023) : sert à prouver que les portes CI (axe, cibles tactiles,
// défilement horizontal, Lighthouse) fonctionnent. Remplacée par l’accueil en T096.
type PageProps = { params: Promise<{ locale: string }> };

const SmokePage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const isFrench = locale === 'fr';
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4 py-12 sm:px-8">
      <p className="text-sm font-semibold tracking-wide text-ocre uppercase">Saloum Évasion</p>
      <h1 className="text-mangrove">
        {isFrench ? 'Le Saloum, vécu de l’intérieur' : 'The Saloum, lived from within'}
      </h1>
      <p className="text-lg text-ink-muted">
        {isFrench
          ? 'Séjours immersifs à Ndangane et dans les îles du Sine-Saloum. Site en construction.'
          : 'Immersive stays in Ndangane and the Sine-Saloum islands. Site under construction.'}
      </p>
      <a
        href={isFrench ? '/en' : '/fr'}
        hrefLang={isFrench ? 'en' : 'fr'}
        className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-mangrove px-6 font-semibold text-sable sm:w-auto"
      >
        {isFrench ? 'English version' : 'Version française'}
      </a>
    </div>
  );
};

export default SmokePage;
