import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="civic-container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">CT</span>
          </div>
          <span className="text-lg font-semibold text-foreground">CivicTrack</span>
        </Link>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Register</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-card px-6 pb-4 pt-2 md:hidden">
          <div className="flex gap-2">
            <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full">Log In</Button>
            </Link>
            <Link to="/register" className="flex-1" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full">Register</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
