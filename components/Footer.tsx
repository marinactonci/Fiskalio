import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 border-t bg-background">
      <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <span>Secure & Private</span>
        </div>
        <p>© {new Date().getFullYear()} Fiskalio. All rights reserved.</p>
      </div>
    </footer>
  );
}
