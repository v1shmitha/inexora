"use client";

import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  GraduationCap,
  LogOut,
  ChevronDown,
  AlertCircle,
  Settings,
  Shield,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  is_admin: boolean;
  fullName: string | null;
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("Profile")
      .select("is_admin, fullName")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) void fetchProfile(user.id);
    };
    void getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const publicNavigation = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Programs", path: "/programs" },
    { name: "Universities", path: "/universities" },
    { name: "Contact", path: "/contact" },
  ];

  const studentNavigation = [
    { name: "Programs", path: "/programs" },
    { name: "Universities", path: "/universities" },
    { name: "Resources", path: "/resources" },
    { name: "Careers", path: "/careers" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  const navigation = user ? studentNavigation : publicNavigation;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setShowSignOutConfirm(false);
      setProfile(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSettingsClick = () => {
    router.push("/settings");
    setIsProfileOpen(false);
  };

  const displayName = profile?.fullName?.split(" ")[0] ?? user?.email?.split("@")[0];
  const avatarLetter = profile?.fullName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white font-sans shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {/* <GraduationCap className="h-8 w-8 text-blue-600" /> */}
            <img src="/favicon-32x32.png" alt="DEH-SL" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              DEH-SL
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth/Profile */}
          <div className="hidden items-center space-x-4 md:flex">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 transition-all hover:bg-gray-100"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {avatarLetter}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                    <div className="mb-1 border-b border-gray-50 px-4 py-2">
                      <p className="text-xs font-semibold uppercase text-gray-400">
                        Logged in as
                      </p>
                      <p className="truncate text-sm font-medium text-gray-900">
                        {user.email}
                      </p>
                    </div>

                    {/* Admin only */}
                    {profile?.is_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <button
                      onClick={handleSettingsClick}
                      className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={() => setShowSignOutConfirm(true)}
                      className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-gray-700 transition hover:text-blue-600"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 py-4 md:hidden">
            {navigation.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full px-4 py-3 text-base font-medium ${
                  pathname === item.path
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <div className="mt-4 space-y-2 border-t border-gray-100 px-4 pt-4">
                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSignOutConfirm(true);
                  }}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 px-4">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center space-x-3 text-amber-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-gray-900">Sign Out?</h3>
            </div>
            <p className="mb-6 text-gray-600">
              Are you sure you want to sign out?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}