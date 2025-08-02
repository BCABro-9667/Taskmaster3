
export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container flex flex-col items-center justify-center gap-2 h-24 md:h-28 py-4">
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} TaskMaster. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Developed by Avdhesh Kumar.
        </p>
      </div>
    </footer>
  );
}
