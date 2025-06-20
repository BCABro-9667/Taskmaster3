
export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container flex flex-col items-center justify-center gap-4 h-20 md:h-24">
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} TaskMaster. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Built with Next.js, Tailwind CSS, and ShadCN UI.
        </p>
      </div>
    </footer>
  );
}
