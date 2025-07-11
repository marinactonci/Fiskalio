"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Filter, ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarGrid } from "./_components/CalendarGrid";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId") as Id<"profiles"> | null;

  // Fetch bill instances - either all or filtered by profile
  const allInstances = useQuery(
    api.billInstances.getAllBillInstancesWithBillNames,
    profileId ? "skip" : undefined,
  );
  const profileInstances = useQuery(
    api.billInstances.getBillInstancesWithBillNamesByProfile,
    profileId ? { profileId } : "skip",
  );

  const instances = profileId ? profileInstances || [] : allInstances || [];

  // Get profile info if filtering by profile
  const profile = useQuery(
    api.profiles.getProfile,
    profileId ? { id: profileId } : "skip",
  );

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const filteredInstances = instances.filter((instance) => {
    if (filter === "paid") return instance.isPaid;
    if (filter === "unpaid") return !instance.isPaid;
    return true;
  });

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Show loading state while fetching data
  if (instances === undefined || (profileId && profile === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            {profileId && (
              <>
                <Link
                  href={`/profiles/${profileId}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hover:bg-muted/50",
                  )}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Profile
                </Link>
                <div className="hidden h-6 w-px bg-border sm:block" />
              </>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {profileId && profile ? `${profile.name} Calendar` : "Calendar"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profileId && profile
                  ? `View and manage bill instances for ${profile.name}`
                  : "View and manage your bill instances by month. Click on a date to quickly edit the details."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile responsive navigation and filters */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        {/* Month Navigation */}
        <div className="flex items-center justify-center lg:justify-start">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="hover:bg-muted/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold w-auto text-center">
              {monthName}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="hover:bg-muted/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and Stats */}
        <div className="flex flex-col items-center space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filter}
              onValueChange={(value: "all" | "paid" | "unpaid") =>
                setFilter(value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bills</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {profileId && profile && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 border-blue-200"
              style={{
                backgroundColor: `${profile.color}20`,
                borderColor: `${profile.color}40`,
                color: profile.color,
              }}
            >
              {profile.name} Only
            </Badge>
          )}

          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 border-green-200"
            >
              {instances.filter((i) => i.isPaid).length} Paid
            </Badge>
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-800 border-red-200"
            >
              {instances.filter((i) => !i.isPaid).length} Unpaid
            </Badge>
          </div>
        </div>
      </div>

      <CalendarGrid
        currentDate={currentDate}
        billInstances={filteredInstances}
      />
    </div>
  );
}
