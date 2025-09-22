
export function LandingFooter() {
  return (
    <footer className="relative border-t border-border/40 bg-background pt-5 pb-4">
      <div className="container flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} TaskMaster. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Developed by Avdhesh Kumar.
        </p>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
         <svg width="30" height="15" viewBox="0 0 30 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0L30 15H0L15 0Z" fill="hsl(var(--primary))"/>
        </svg>
      </div>
    </footer>
  );
}
