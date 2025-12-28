"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, Calendar, FileText, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import BillCard from "../_components/BillCard";
import { ProfileDashboard } from "../_components/ProfileDashboard";
import CreateBillDialog from "../_components/CreateBillDialog";
import DeleteProfileAlertDialog from "../_components/DeleteProfileAlertDialog";
import UpdateProfileDialog from "../_components/UpdateProfileDialog";
import ColorPicker from "../_components/ColorPicker";
import { PageContainer } from "@/components/PageContainer";

export default function Profile() {
  const { id } = useParams();

  // Only make the query if the ID is valid
  const profileResult = useQuery(api.profiles.getProfile, {
    id: id as Id<"profiles">,
  });

  const billsResult = useQuery(api.bills.getBillsForProfile, {
    profileId: id as Id<"profiles">,
  });

  if (!profileResult || !billsResult) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  if (!profileResult.success) {
    return (
      <PageContainer>
        <div className="py-16 text-center">
          <h2 className="mb-4 font-semibold text-2xl">Profile not found</h2>
          <p className="text-muted-foreground mb-4">{profileResult.error}</p>
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href={"/profiles"}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profiles
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!billsResult.success) {
    return (
      <PageContainer>
        <div className="py-16 text-center">
          <h2 className="mb-4 font-semibold text-2xl">Error loading bills</h2>
          <p className="text-muted-foreground mb-4">{billsResult.error}</p>
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href={"/profiles"}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profiles
          </Link>
        </div>
      </PageContainer>
    );
  }

  const profile = profileResult.data!;
  const bills = billsResult.data || [];

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <Link
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hover:bg-muted/50",
            )}
            href={"/profiles"}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-2xl text-transparent sm:text-3xl">
                {profile.name}
              </h1>
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: profile.color || "#3b82f6" }}
                title="Profile color"
              />
              <ColorPicker profile={profile} />
            </div>
            <div className="mt-1 flex flex-col space-y-1 text-muted-foreground sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="break-all text-sm sm:text-base">
                  {profile.address.street}, {profile.address.city},{" "}
                  {profile.address.country}
                </span>
              </div>
            </div>
          </div>
          <div className="flex w-full space-x-2 sm:w-auto">
            <UpdateProfileDialog profile={profile} />
            <DeleteProfileAlertDialog profile={profile} />
          </div>
        </div>

        <ProfileDashboard profileId={id as Id<"profiles">} bills={bills} />

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-2xl">Bills</h2>
          <div className="flex space-x-3">
            <Link
              href={`/calendar?profileId=${profile._id}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hover:bg-muted/50",
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View in Calendar
            </Link>
            {bills.length > 0 && (
              <CreateBillDialog
                text="Add New Bill"
                profileId={id as Id<"profiles">}
              />
            )}
          </div>
        </div>

        {bills.length === 0 ? (
          <Card className="border-2 border-muted-foreground/25 border-dashed bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="mb-2 font-semibold text-xl">No bills yet</h3>
              <p className="mb-6 max-w-md text-center text-muted-foreground">
                Add your first bill to start tracking monthly instances
              </p>
              <CreateBillDialog
                text="Add Your First Bill"
                profileId={id as Id<"profiles">}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bills.map((bill) => (
              <BillCard bill={bill} key={bill._id} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
