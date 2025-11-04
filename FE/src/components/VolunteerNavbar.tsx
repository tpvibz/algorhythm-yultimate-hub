import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, Home, LogOut, RefreshCw, ChevronDown } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";

const VolunteerNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleLogout = () => {
    // Add your logout logic here (clear tokens, etc.)
    console.log("Logging out...");
    // Redirect to login page
    window.location.href = "/select-role";
  };

  const handleSwitchRole = (role) => {
    // Add your role switching logic here
    console.log(`Switching to ${role} role...`);
    setShowRoleMenu(false);
    
    // Navigate to respective dashboard
    if (role === "player") {
      window.location.href = "/login/player";
    } else if (role === "admin") {
      window.location.href = "/login/admin";
    }
  };

  const handleHome = () => {
    window.location.href = "/volunteer-dashboard";
  };

  return (
    <>
      {/* Desktop Floating Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:block">
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-full px-8 py-4 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-8">
            {/* Logo/Brand */}
            <button onClick={handleHome} className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Volunteer Portal
              </span>
            </button>

            <div className="h-6 w-px bg-border"></div>

            {/* Navigation Links */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleHome}
                className="rounded-full gap-2 hover:bg-green-500/10 hover:text-green-600"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>

              {/* Switch Roles Dropdown */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full gap-2 hover:bg-purple-500/10 hover:text-purple-600"
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Switch Role
                  <ChevronDown className={`h-3 w-3 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
                </Button>

                {showRoleMenu && (
                  <div className="absolute top-full mt-2 right-0 w-48 bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-xl overflow-hidden animate-slide-up">
                    <button
                      onClick={() => handleSwitchRole("player")}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-blue-500/10 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      Player Dashboard
                    </button>
                    <button
                      onClick={() => handleSwitchRole("admin")}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-orange-500/10 hover:text-orange-600 transition-colors flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                      Admin Dashboard
                    </button>
                  </div>
                )}
              </div>

              <LanguageSelector />
              <ThemeToggle />

              {/* Logout Button */}
              <Button 
                size="sm" 
                onClick={handleLogout}
                className="rounded-full gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="fixed top-0 w-full z-50 md:hidden bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button onClick={handleHome} className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Volunteer Portal
              </span>
            </button>

            <button
              className="text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {isOpen && (
            <div className="py-4 space-y-3 animate-slide-up">
              <button 
                onClick={() => {
                  handleHome();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 py-2 w-full text-foreground hover:text-green-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </button>

              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">SWITCH ROLE</p>
                <button
                  onClick={() => {
                    handleSwitchRole("player");
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 py-2 w-full text-foreground hover:text-blue-600 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  Player Dashboard
                </button>
                <button
                  onClick={() => {
                    handleSwitchRole("admin");
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 py-2 w-full text-foreground hover:text-orange-600 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                  Admin Dashboard
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <LanguageSelector />
                  <ThemeToggle />
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Click outside to close role menu */}
      {showRoleMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowRoleMenu(false)}
        ></div>
      )}
    </>
  );
};

export default VolunteerNavbar;