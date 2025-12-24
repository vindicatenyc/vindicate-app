export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Vindicate NYC</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Open-source financial recovery and legal case management platform
            for individuals navigating debt disputes, tax recovery, and arbitration.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            title="433-A Calculator"
            description="Calculate your disposable income and IRS Offer in Compromise amounts using official IRS methodology."
            href="/calculator"
          />
          <FeatureCard
            title="Credit Report Parser"
            description="Upload and parse credit reports from major bureaus to identify potential violations."
            href="/credit-report"
          />
          <FeatureCard
            title="Dispute Generator"
            description="Generate FCRA-compliant dispute letters and track 30-day investigation deadlines."
            href="/disputes"
          />
        </div>

        <footer className="mt-16 text-center text-gray-400">
          <p className="mb-2">
            <strong>Disclaimer:</strong> This is not legal advice.
            Consult with a licensed attorney before taking any legal action.
          </p>
          <p>
            <a
              href="https://github.com/vindicatenyc/vindicate-app"
              className="text-blue-400 hover:underline"
            >
              Star us on GitHub
            </a>
            {' | '}
            <a href="/docs" className="text-blue-400 hover:underline">
              Documentation
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-400">{description}</p>
    </a>
  );
}
