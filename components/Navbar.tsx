"use client";

import { UserButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated } from "convex/react";
import React, { useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Button, buttonVariants } from "./ui/button";
import { PiggyBank, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

function Navbar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", isActive: pathname === "/" },
    {
      href: "/profiles",
      label: "Profiles",
      isActive: pathname.startsWith("/profiles"),
    },
    {
      href: "/calendar",
      label: "Calendar",
      isActive: pathname === "/calendar",
    },
    {
      href: "/analytics",
      label: "Analytics",
      isActive: pathname === "/analytics",
    },
  ];

  return (
    <header className="h-14 border-b shadow-sm grid place-items-center">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href={"/"} className="flex items-center gap-2">
          <PiggyBank className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Fiskalio</h1>
        </Link>

        {isMobile ? (
          <div className="flex items-center gap-3">
            <Authenticated>
              <UserButton />
            </Authenticated>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 px-6 py-4">
                    {/* Navigation Links */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Navigation
                      </h3>
                      <nav>
                        <ul className="flex flex-col space-y-1">
                          {links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  buttonVariants(
                                    link.isActive
                                      ? { variant: "outline" }
                                      : { variant: "ghost" },
                                  ),
                                  "w-full justify-start px-3 py-2.5 h-auto",
                                )}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    </div>

                    {/* Theme Toggle */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Preferences
                      </h3>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm">Theme</span>
                        <ModeToggle />
                      </div>
                    </div>

                    {/* User Authentication - Only show for unauthenticated users */}
                    <Unauthenticated>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          Account
                        </h3>
                        <div className="flex flex-col gap-2">
                          <SignInButton>
                            <Button variant="outline" className="w-full">
                              Sign in
                            </Button>
                          </SignInButton>
                          <SignUpButton>
                            <Button className="w-full">Sign up</Button>
                          </SignUpButton>
                        </div>
                      </div>
                    </Unauthenticated>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <nav>
              <ul className="flex items-center space-x-4">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        buttonVariants(
                          link.isActive
                            ? { variant: "outline" }
                            : { variant: "ghost" },
                        ),
                        "px-3 py-2",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <ModeToggle />
            <Authenticated>
              <UserButton />
            </Authenticated>
            <Unauthenticated>
              <div className="flex items-center gap-4">
                <SignInButton>
                  <Button variant="outline">Sign in</Button>
                </SignInButton>
                <SignUpButton>
                  <Button>Sign up</Button>
                </SignUpButton>
              </div>
            </Unauthenticated>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
