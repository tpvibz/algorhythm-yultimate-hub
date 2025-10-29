import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-card/20 backdrop-blur-2xl border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AlgoRhythm
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/tournaments" className="text-foreground hover:text-primary transition-colors">
              Tournaments
            </Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-3 animate-slide-up">
            <Link to="/" className="block py-2 text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/about" className="block py-2 text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/tournaments" className="block py-2 text-foreground hover:text-primary transition-colors">
              Tournaments
            </Link>
            <Link to="/contact" className="block py-2 text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="w-full bg-gradient-to-r from-primary to-secondary">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
