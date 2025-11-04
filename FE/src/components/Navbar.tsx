import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap,ChevronRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import Translate from "./Translate";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Floating Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:block">
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-full px-8 py-4 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary">
                YUltimate
              </span>
            </Link>

            <div className="flex items-center gap-6">
              <Link 
                to="/" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors px-4 py-2 rounded-full hover:bg-accent"
              >
                <Translate>Home</Translate>
              </Link>
              <Link 
                to="/about-us" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors px-4 py-2 rounded-full hover:bg-accent"
              >
                <Translate>About</Translate>
              </Link>
              <Link 
                to="/tournaments" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors px-4 py-2 rounded-full hover:bg-accent"
              >
                <Translate>Tournaments</Translate>
              </Link>
              <Link 
                to="/contact" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors px-4 py-2 rounded-full hover:bg-accent"
              >
                <Translate>Contact</Translate>
              </Link>
            </div>

            <div className="flex items-center gap-3 ml-2">
              <LanguageSelector />
              <ThemeToggle />
              
              
              <Link to="/select-role">
                <Button 
                  size="sm" 
                  className="rounded-full px-4 group"
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="fixed top-0 w-full z-50 md:hidden bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">AlgoRhythm</span>
            </Link>

            <button
              className="text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {isOpen && (
            <div className="py-4 space-y-3 animate-slide-up">
              <Link 
                to="/" 
                className="block py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Translate>Home</Translate>
              </Link>
              <Link 
                to="/about" 
                className="block py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Translate>About</Translate>
              </Link>
              <Link 
                to="/tournaments" 
                className="block py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Translate>Tournaments</Translate>
              </Link>
              <Link 
                to="/contact" 
                className="block py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Translate>Contact</Translate>
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <LanguageSelector />
                  <ThemeToggle />
                </div>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Translate>Login</Translate>
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button size="sm" className="w-full">
                    <Translate>Register</Translate>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;