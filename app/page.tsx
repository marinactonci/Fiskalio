"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Home,
  BarChart3,
  CheckCircle2,
  Clock,
  Palette,
  ArrowRight,
  Sparkles,
  CreditCard,
  LayoutGrid,
  BellRing,
} from "lucide-react";
import Link from "next/link";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-blue-100 selection:text-blue-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-background to-background dark:from-blue-900/20"></div>

        <div className="container px-4 mx-auto text-center max-w-5xl">
          <div className="animate-fade-in-up opacity-0 [animation-fill-mode:forwards] [animation-duration:0.7s]">
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 rounded-full text-sm border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2 fill-blue-400 text-blue-400" />
              The new standard for bill management
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground">
              Master your finances. <br />
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Effortlessly.
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Fiskalio brings clarity to your financial life. Manage multiple
              properties, track bills, and visualize your spending in one
              beautiful, intuitive interface.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Authenticated>
                <Button
                  size="lg"
                  className="rounded-full text-lg px-8 h-14 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
                  asChild
                >
                  <Link href="/profiles">
                    Open Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </Authenticated>
              <Unauthenticated>
                <SignUpButton>
                  <Button
                    size="lg"
                    className="rounded-full text-lg px-8 h-14 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
                  >
                    Get Started Free
                  </Button>
                </SignUpButton>
              </Unauthenticated>

              <Button
                variant="ghost"
                size="lg"
                className="rounded-full text-lg px-8 h-14 hover:bg-muted/50"
                asChild
              >
                <Link href="#features">Learn more</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid (Bento Box Style) */}
      <section id="features" className="py-24 container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Feature 1: Profile Management - Large Block */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-all group-hover:bg-blue-500/20"></div>

            <div className="relative z-10">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Home className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Profile Management
              </h3>
              <p className="text-muted-foreground text-lg mb-6 max-w-md">
                Create and manage multiple profiles for properties, households,
                or businesses. Customize each with unique colors and address
                details.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Palette className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-sm">Custom Colors</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-sm">Per-profile Stats</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Calendar - Tall Block */}
          <div className="md:row-span-2 group relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm transition-all hover:shadow-md flex flex-col">
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-green-500/10 blur-3xl transition-all group-hover:bg-green-500/20"></div>

            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Visual Calendar</h3>
            <p className="text-muted-foreground text-lg mb-6">
              See your financial month at a glance. Color-coded bills, payment
              status indicators, and quick edit functionality.
            </p>

            <div className="mt-auto space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Filter by paid/unpaid</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>Overdue highlighting</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <LayoutGrid className="h-4 w-4 text-blue-500" />
                <span>Monthly overview</span>
              </div>
            </div>
          </div>

          {/* Feature 3: Bill Tracking - Standard Block */}
          <div className="group relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Smart Bill Tracking</h3>
            <p className="text-muted-foreground mb-4">
              Add bills with amounts, due dates, and e-bill credentials. We
              handle the organization.
            </p>
          </div>

          {/* Feature 4: Notifications - Standard Block */}
          <div className="group relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <BellRing className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">
              Never Miss a Due Date
            </h3>
            <p className="text-muted-foreground mb-4">
              Automatic overdue detection ensures you stay on top of every
              payment, every time.
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Breakdown Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Designed for peace of mind
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools wrapped in simplicity.
            </p>
          </div>

          <div className="space-y-24">
            {/* Detail 1 */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400">
                  Profile Management
                </div>
                <h3 className="text-3xl font-bold">Organize your way.</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Whether you manage a single apartment or a portfolio of
                  properties, Fiskalio adapts to you. Create distinct profiles
                  for each entity, assign custom colors for easy recognition,
                  and track performance metrics individually.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span>Multiple property support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <span>Address & detail management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <span>Payment performance stats</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-3xl p-8 aspect-square flex items-center justify-center shadow-inner">
                <Home
                  className="w-32 h-32 text-blue-200 dark:text-blue-800"
                  strokeWidth={1}
                />
              </div>
            </div>

            {/* Detail 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400">
                  Bill Tracking
                </div>
                <h3 className="text-3xl font-bold">
                  All your bills, demystified.
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stop digging through emails and paper stacks. Centralize your
                  bill information with support for e-bill credentials, amounts,
                  and due dates. Mark bills as paid with a single tap.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span>Store e-bill logins securely</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <span>Monthly bill instances</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <span>Automatic overdue detection</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-3xl p-8 aspect-square flex items-center justify-center shadow-inner">
                <CreditCard
                  className="w-32 h-32 text-purple-200 dark:text-purple-800"
                  strokeWidth={1}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 container px-4 mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-foreground text-background px-6 py-16 md:px-16 md:py-20 text-center">
          <div className="absolute top-0 left-0 -mt-10 -ml-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 -mb-10 -mr-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to take control?
            </h2>
            <p className="text-lg md:text-xl text-background/70 mb-10 max-w-xl mx-auto">
              Join the community of users who have simplified their financial
              lives with Fiskalio.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Authenticated>
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full text-lg px-8 h-14"
                  asChild
                >
                  <Link href="/profiles">Go to Dashboard</Link>
                </Button>
              </Authenticated>
              <Unauthenticated>
                <SignUpButton>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full text-lg px-8 h-14"
                  >
                    Start for Free
                  </Button>
                </SignUpButton>
              </Unauthenticated>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
