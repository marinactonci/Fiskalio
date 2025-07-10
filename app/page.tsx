"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Home,
  BarChart3,
  CheckCircle,
  Clock,
  Palette,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Star,
  PiggyBank,
} from "lucide-react";
import Link from "next/link";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="space-y-20">
      <section className="text-center py-12">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Star className="h-3 w-3 mr-1" />
            Bill Management Made Simple
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Never Miss a Bill Again
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Fiskalio helps you organize, track, and manage bills across
            multiple properties. Get visual insights, calendar views, and
            never worry about overdue payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Authenticated>
              <Button size="lg" className="text-lg px-8 py-3" asChild>
                <Link href="/profiles">
                  Open App <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </Authenticated>
            <Unauthenticated>
              <SignUpButton>
                <Button size="lg" className="text-lg px-8 py-3">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
            </Unauthenticated>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Everything You Need to Stay Organized
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make bill management effortless and
            intuitive
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow border-2">
            <CardHeader>
              <Home className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Multi-Property Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create profiles for different properties, households, or
                business locations. Keep everything organized with custom
                colors and addresses.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2">
            <CardHeader>
              <Calendar className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Visual Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                See all your bills in a beautiful monthly calendar view.
                Color-coded by profile with payment status indicators.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Smart Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track spending patterns, monitor payment performance, and get
                insights into your bill management across all profiles.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2">
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-emerald-600 mb-2" />
              <CardTitle>Payment Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Mark bills as paid or unpaid with one click. Automatic overdue
                detection ensures you never miss important payments.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2">
            <CardHeader>
              <Palette className="h-10 w-10 text-pink-600 mb-2" />
              <CardTitle>Customizable Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Personalize each profile with custom colors, names, and
                addresses. Make it easy to distinguish between different
                properties.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2">
            <CardHeader>
              <Zap className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Edit bills directly from calendar view, bulk actions, and
                intuitive drag-and-drop functionality for efficient
                management.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 rounded-lg p-8 lg:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Simple Steps to Get Started
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Set up your bill tracking system in minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Profiles</h3>
            <p className="text-muted-foreground">
              Set up profiles for each property or household you want to track
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Add Bills</h3>
            <p className="text-muted-foreground">
              Add your recurring bills with amounts, due dates, and
              descriptions
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 dark:bg-purple-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Track & Manage</h3>
            <p className="text-muted-foreground">
              Monitor payments, view calendar, and get insights into your
              spending
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Why Choose Fiskalio?
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for modern households and property managers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Multi-Property Support</h3>
              <p className="text-muted-foreground">
                Perfect for landlords, property managers, or anyone managing
                multiple locations
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your financial data is encrypted and stored securely with
                enterprise-grade security
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Never Miss Due Dates</h3>
              <p className="text-muted-foreground">
                Automatic overdue detection and visual indicators keep you
                on track
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-muted-foreground">
                Understand your spending patterns and optimize your budget
                management
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 lg:p-12">
        <div className="text-center text-white">
          <PiggyBank className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Take Control of Your Bills?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have simplified their bill management
            with Fiskalio
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Authenticated>
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-3"
                asChild
              >
                <Link href="/profiles">
                  Open App <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </Authenticated>
            <Unauthenticated>
              <SignUpButton>
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-3"
                >
                  Start Free Today <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
            </Unauthenticated>
          </div>
        </div>
      </section>
    </div>
  );
}
