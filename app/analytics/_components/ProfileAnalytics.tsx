"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface ProfileAnalyticsProps {
  profiles: Array<{ _id: Id<"profiles">; name: string }>;
}

function ProfileAnalytics({ profiles }: ProfileAnalyticsProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    profiles.length > 0 ? profiles[0]._id : ""
  );

  const profileData = useQuery(
    api.analytics.getProfileMonthlyCostData,
    selectedProfileId ? { profileId: selectedProfileId as Id<"profiles"> } : "skip"
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + "€";
  };

  const formatMonth = (month: string) => {
    try {
      // Handle different date formats
      if (!month || typeof month !== 'string') return 'Invalid';

      // If already in a readable format, return as is
      if (month.includes('-')) {
        const parts = month.split('-');
        if (parts.length !== 2) return month;

        const [year, monthNum] = parts;
        const yearNum = parseInt(year);
        const monthNumInt = parseInt(monthNum);

        if (isNaN(yearNum) || isNaN(monthNumInt) || monthNumInt < 1 || monthNumInt > 12) {
          return 'Invalid';
        }

        const date = new Date(yearNum, monthNumInt - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      return month;
    } catch {
      return 'Invalid';
    }
  };

  if (!profiles.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No profiles found</p>
        </CardContent>
      </Card>
    );
  }

  if (!profileData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!profileData.success) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">{profileData.error}</p>
        </CardContent>
      </Card>
    );
  }

  const data = profileData.data!;
  const monthlyData = [...data.monthlyData].reverse(); // Reverse so latest month is on the right

  // Calculate analytics
  const totalSpent = monthlyData.reduce((sum, item) => sum + item.total, 0);
  const averageMonthly = monthlyData.length > 0 ? totalSpent / monthlyData.length : 0;
  const highestMonth = monthlyData.reduce((max, current) =>
    current.total > max.total ? current : max, monthlyData[0] || { month: '', total: 0 }
  );
  const lowestMonth = monthlyData.reduce((min, current) =>
    current.total < min.total ? current : min, monthlyData[0] || { month: '', total: 0 }
  );

  // Calculate trend
  const getTrend = () => {
    if (monthlyData.length < 2) return null;

    const recent = monthlyData.slice(-3); // Last 3 months
    const older = monthlyData.slice(-6, -3); // Previous 3 months

    if (recent.length === 0 || older.length === 0) return null;

    const recentAvg = recent.reduce((sum, item) => sum + item.total, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.total, 0) / older.length;

    if (olderAvg === 0) return null;

    const trend = ((recentAvg - olderAvg) / olderAvg) * 100;
    return {
      value: Math.abs(trend),
      isIncreasing: trend > 0,
    };
  };

  const trend = getTrend();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profile-Specific Analytics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed spending analysis for individual profiles
            </p>
          </div>
          <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile._id} value={profile._id}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Months</p>
                <p className="font-bold">{monthlyData.length}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="font-bold">{formatCurrency(totalSpent)}</p>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Average Monthly</p>
              <p className="font-bold">{formatCurrency(averageMonthly)}</p>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              {trend ? (
                <>
                  {trend.isIncreasing ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">3-Month Trend</p>
                    <div className="flex items-center space-x-1">
                      <p className="font-bold">{trend.value.toFixed(1)}%</p>
                      <Badge variant={trend.isIncreasing ? "destructive" : "default"} className="text-xs">
                        {trend.isIncreasing ? "Up" : "Down"}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Trend</p>
                  <p className="font-bold">N/A</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Highest and Lowest Months */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-sm text-red-600 mb-2">Highest Spending Month</h4>
            <p className="text-2xl font-bold">{formatCurrency(highestMonth.total)}</p>
            <p className="text-sm text-muted-foreground">{formatMonth(highestMonth.month)}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-sm text-green-600 mb-2">Lowest Spending Month</h4>
            <p className="text-2xl font-bold">{formatCurrency(lowestMonth.total)}</p>
            <p className="text-sm text-muted-foreground">{formatMonth(lowestMonth.month)}</p>
          </div>
        </div>

        {/* Monthly Spending Chart */}
        <div>
          <h4 className="font-semibold mb-4">Monthly Spending for {data.profileName}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip
                labelFormatter={(month: string) => `Month: ${formatMonth(month)}`}
                formatter={(value: number) => [formatCurrency(value), "Total"]}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8884d8"
                strokeWidth={3}
                dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Bar Chart */}
        <div>
          <h4 className="font-semibold mb-4">Monthly Comparison</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip
                labelFormatter={(month: string) => `Month: ${formatMonth(month)}`}
                formatter={(value: number) => [formatCurrency(value), "Total"]}
              />
              <Bar
                dataKey="total"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} export default ProfileAnalytics;
