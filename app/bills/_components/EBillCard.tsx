"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, Eye, EyeOff, Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bill } from "@/convex/schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { decryptString } from "@/lib/utils";

interface EBillCardProps {
  eBill: Bill["eBill"];
}

function EBillCard({ eBill }: EBillCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch {
      toast.error(`Failed to copy ${type.toLowerCase()}`);
    }
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ebill-link" className="text-sm font-medium">
            Website
          </Label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              id="ebill-link"
              value={eBill?.link || ""}
              readOnly
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(eBill?.link, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(eBill?.link || "", "Link")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="ebill-username" className="text-sm font-medium">
            Username
          </Label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              id="ebill-username"
              value={decryptString(eBill?.username || "")}
              readOnly
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                copyToClipboard(
                  decryptString(eBill?.username || ""),
                  "Username",
                )
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="ebill-password" className="text-sm font-medium">
            Password
          </Label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              id="ebill-password"
              type={showPassword ? "text" : "password"}
              value={decryptString(eBill?.password || "")}
              readOnly
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                copyToClipboard(
                  decryptString(eBill?.password || ""),
                  "Password",
                )
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EBillCard;
