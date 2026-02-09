export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Branding */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
          V
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Vindicate NYC
        </h1>
        <p className="text-sm text-muted-foreground">
          Your financial recovery companion
        </p>
      </div>
      {children}
    </div>
  );
}
