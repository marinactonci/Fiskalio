"use client";

import { Home as HomeIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreateProfileDialog } from "@/app/_components/CreateProfileDialog";
import ProfileCard from "@/app/_components/ProfileCard";

export default function Home() {
  const profiles = useQuery(api.profiles.getProfilesForUser);

  if (!profiles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bill Tracker
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your bills across multiple properties
          </p>
        </div>
        {profiles.length > 0 && <CreateProfileDialog />}
      </div>

      {profiles.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25 bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HomeIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No profiles yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first profile to start tracking bills for your
              properties
            </p>
            <CreateProfileDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard key={profile._id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
