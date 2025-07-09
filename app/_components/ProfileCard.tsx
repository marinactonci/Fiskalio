import { Profile } from "@/convex/schema";
import Link from "next/link";
import React from "react";
import { FileText, Home as HomeIcon, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";

interface ProfileCardProps {
  profile: Profile;
}

function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Link href={`/profile/${profile._id}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card backdrop-blur-sm border-muted/20 hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-400/30 dark:to-purple-400/30 group-hover:from-blue-500/30 group-hover:to-purple-500/30 dark:group-hover:from-blue-400/40 dark:group-hover:to-purple-400/40 transition-colors">
                <HomeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {profile.name}
                </CardTitle>
                <div
                  className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: profile.color || "#3b82f6" }}
                  title="Profile color"
                />
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-blue-500/15 to-purple-500/15 dark:from-blue-400/25 dark:to-purple-400/25 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
            >
              {profile.billCount} bills
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground dark:text-slate-400" />
            <div>
              <p>{profile.address.street}</p>
              <p>
                {profile.address.city}, {profile.address.country}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground dark:text-slate-400">
              <FileText className="h-3 w-3" />
              <span>Created {format(profile._creationTime!, "PPP")}</span>
            </div>
            <div className="text-xs text-primary font-medium group-hover:text-primary/80 transition-colors">
              View Details →
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default ProfileCard;
