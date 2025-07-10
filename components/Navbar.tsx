"use client";

import { UserButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated } from "convex/react";
import React from "react";
import { ModeToggle } from "./ModeToggle";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Button, buttonVariants } from "./ui/button";
import { PiggyBank } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function Navbar() {
  const pathname = usePathname();

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
  ];

  return (
    <header className="h-14 border-b shadow-sm grid place-items-center">
      <div className="container mx-auto px-4 flex justify-between">
        <Link href={"/"} className="flex items-center gap-2">
          <PiggyBank className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Fiskalio</h1>
        </Link>
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
      </div>
    </header>
  );
}

export default Navbar;
