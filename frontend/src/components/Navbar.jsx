import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button from "./Button";

const Navbar = () => {
  const { isAuthenticated, logout, user, login } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const canCreateEvent = user?.role === "ORGANIZER";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest(".mobile-menu-button")) return;

      if (mobileMenuOpen && !event.target.closest(".mobile-menu-container")) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const handleMobileMenuClick = (callback) => {
    setMobileMenuOpen(false);
    if (callback) callback();
  };

  const toggleMobileMenu = (e) => {
    e.stopPropagation();
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav
      className={`fixed w-full z-50 top-0 left-0 right-0 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-100 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-width px-6">
        <div className="flex items-center justify-between">
          {/* Logo Group */}
          <Link to="/" className="flex flex-col leading-none z-20 group">
            <span className="text-4xl font-bold tracking-tight text-black">
              Orbis
            </span>
            <span className="text-[15px] uppercase tracking-widest text-gray-400 font-semibold group-hover:text-black transition-colors pl-3">
              by NITK
            </span>
          </Link>

          {/* 2 Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-x-8">
            {[
              { name: "About", href: `${import.meta.env.BASE_URL}#about`, isAnchor: true },
              { name: "Events", href: "/events" },
              { name: "Community", href: "/community" },
              { name: "Forms", href: "/forms" },
              { name: "Testimonials", href: `${import.meta.env.BASE_URL}#testimonials`, isAnchor: true },
              { name: "Projects", href: "/projects" },
            ].map((link) =>
              link.isAnchor ? (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
                >
                  {link.name}
                </Link>
              ),
            )}

            {isAuthenticated && (
              <>
                <Link
                  to="/inbox"
                  className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
                >
                  Inbox
                </Link>
                <Link
                  to="/org-dashboard"
                  className="text-sm font-semibold  text-gray-500 hover:text-indigo-800 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            )}
          </div>

          {/* 3. Streamlined Auth Buttons */}
          <div className="hidden md:flex items-center gap-x-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-gray-500 hover:text-black mr-2"
                >
                  Profile
                </Link>
                <Button
                  variant="secondary"
                  to="/create"
                  size="sm"
                  className="px-4 py-2 text-xs"
                >
                  Create Form
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => logout()}
                  className="px-4 py-2 text-xs"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="text"
                  onClick={() => login()}
                  className="text-sm font-medium"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => login({ screen_hint: "signup" })}
                >
                  Register
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="mobile-menu-button md:hidden z-30 p-2 focus:outline-none"
          >
            <div className="space-y-1.5">
              <div
                className={`w-6 h-0.5 bg-black transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <div
                className={`w-6 h-0.5 bg-black transition-all ${mobileMenuOpen ? "opacity-0" : ""}`}
              />
              <div
                className={`w-6 h-0.5 bg-black transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </div>
          </button>

          {/* Mobile Menu Dropdown */}
          <div
            className={`mobile-menu-container absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-gray-100 rounded-b-3xl transition-all duration-300 ease-in-out md:hidden overflow-hidden ${
              mobileMenuOpen ? "max-h-[85vh] opacity-100 py-6" : "max-h-0 opacity-0 py-0 pointer-events-none"
            }`}
          >
            <div className="flex flex-col justify-start items-center space-y-5 text-center overflow-y-auto px-6 h-full" style={{ maxHeight: 'calc(85vh - 3rem)' }}>
              {[
                { name: "About", href: `${import.meta.env.BASE_URL}#about`, isAnchor: true },
                { name: "Events", href: "/events" },
                { name: "Community", href: "/community" },
                { name: "Forms", href: "/forms" },
                { name: "Testimonials", href: `${import.meta.env.BASE_URL}#testimonials`, isAnchor: true },
                { name: "Projects", href: "/projects" },
              ].map((link) =>
                link.isAnchor ? (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => handleMobileMenuClick()}
                    className="text-xl font-medium text-gray-800 hover:text-black transition-colors"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => handleMobileMenuClick()}
                    className="text-xl font-medium text-gray-800 hover:text-black transition-colors"
                  >
                    {link.name}
                  </Link>
                ),
              )}
              
              {isAuthenticated && (
                <>
                  <Link
                    to="/inbox"
                    onClick={() => handleMobileMenuClick()}
                    className="text-xl font-medium text-gray-800 hover:text-black transition-colors"
                  >
                    Inbox
                  </Link>
                  <Link
                    to="/org-dashboard"
                    onClick={() => handleMobileMenuClick()}
                    className="text-xl font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => handleMobileMenuClick()}
                    className="text-xl font-medium text-gray-800 hover:text-black"
                  >
                    Profile
                  </Link>
                  <Button
                    variant="secondary"
                    to="/create"
                    onClick={() => handleMobileMenuClick()}
                    className="w-[200px] justify-center mt-2"
                  >
                    Create Form
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleMobileMenuClick(logout)}
                    className="w-[200px] justify-center mt-2"
                  >
                    Logout
                  </Button>
                </>
              )}
              
              {!isAuthenticated && (
                <div className="flex flex-col gap-3 mt-4 w-[200px] pb-4">
                  <Button
                    variant="secondary"
                    onClick={() => handleMobileMenuClick(login)}
                    className="justify-center"
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleMobileMenuClick(() => login({ screen_hint: "signup" }))}
                    className="justify-center"
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;