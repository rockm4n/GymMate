import { useState } from "react";
import { Button } from "../ui/button";

interface UserNavProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  userName?: string;
  userRole?: "member" | "staff";
}

export function UserNav({ 
  isAuthenticated = false, 
  userEmail,
  userName,
  userRole = "member" 
}: UserNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Display name: prefer userName, fallback to email username, then first letter
  const displayName = userName || userEmail?.split("@")[0] || userEmail || "User";
  const avatarLetter = (userName || userEmail)?.[0]?.toUpperCase() || "U";
  const isStaff = userRole === "staff";

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Logout successful - redirect to home page
        // Using window.location.href for full page reload to clear all client state
        window.location.href = "/";
      } else {
        console.error("Logout failed");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <nav className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <a href="/login">Zaloguj się</a>
        </Button>
        <Button asChild>
          <a href="/register">Zarejestruj się</a>
        </Button>
      </nav>
    );
  }

  return (
    <nav className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
        aria-label="Menu użytkownika"
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
          {avatarLetter}
        </div>
        <div className="hidden sm:flex sm:flex-col sm:items-start">
          <span className="text-sm font-medium">{displayName}</span>
          {userEmail && userName && (
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div 
            className="absolute right-0 top-full mt-2 z-50 min-w-[240px] rounded-md border bg-popover p-1 shadow-md"
            role="menu"
            aria-label="Menu użytkownika"
          >
            {/* User Info Section */}
            <div className="px-3 py-2 border-b mb-1">
              <p className="text-sm font-medium">{displayName}</p>
              {userEmail && (
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              )}
              {isStaff && (
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Personel
                </span>
              )}
            </div>

            {/* Navigation Links */}
            <a
              href="/app/profile"
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Mój Profil
            </a>
            
            <a
              href="/app/schedule"
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Harmonogram
            </a>

            {/* Admin Link - only for staff */}
            {isStaff && (
              <a
                href="/admin/dashboard"
                className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Panel Administracyjny
              </a>
            )}

            <div className="my-1 border-t" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
              role="menuitem"
              aria-label="Wyloguj się"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
            </button>
          </div>
        </>
      )}
    </nav>
  );
}

