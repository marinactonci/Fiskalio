"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Calculator,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import MonthlyComparison from "./MonthlyComparison";
import ProfileAnalytics from "./ProfileAnalytics";
import RecentActivity from "./RecentActivity";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
          {trend && (
            <div
              className={`flex items-center space-x-1 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">{trend.value}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthlyCostChartProps {
  data: Array<{ month: string; total: number; [key: string]: number | string }>;
  profiles: string[];
  selectedProfile?: string;
  onProfileSelect?: (profile: string) => void;
}

function MonthlyCostChart({
  data,
  profiles,
  selectedProfile,
  onProfileSelect,
}: MonthlyCostChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatMonth = (month: string) => {
    try {
      // Handle different month formats
      if (!month || typeof month !== "string") return "Invalid";

      // If already in a readable format, return as is
      if (month.length <= 7 && month.includes("-")) {
        const [year, monthNum] = month.split("-");
        const yearNum = parseInt(year);
        const monthNumInt = parseInt(monthNum);

        if (
          isNaN(yearNum) ||
          isNaN(monthNumInt) ||
          monthNumInt < 1 ||
          monthNumInt > 12
        ) {
          return "Invalid";
        }

        const date = new Date(yearNum, monthNumInt - 1);
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
      }

      return month;
    } catch {
      return "Invalid";
    }
  };

  // Create chart config
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monthly Costs Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total monthly expenses across all profiles
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={selectedProfile || "all"}
              onValueChange={onProfileSelect}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile} value={profile}>
                    {profile}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip
              labelFormatter={(month: string) => `Month: ${formatMonth(month)}`}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name,
              ]}
            />
            <Legend />
            {selectedProfile === "all" || !selectedProfile ? (
              <>
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={COLORS[0]}
                  strokeWidth={3}
                  dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {profiles.map((profile, index) => (
                  <Line
                    key={profile}
                    type="monotone"
                    dataKey={profile}
                    stroke={COLORS[(index % COLORS.length) + 1]}
                    strokeWidth={2}
                    dot={{ strokeWidth: 2, r: 3 }}
                  />
                ))}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={selectedProfile}
                stroke={COLORS[0]}
                strokeWidth={3}
                dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
interface BillStatusChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

function BillStatusChart({ data }: BillStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill Status Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Overview of paid vs unpaid bills
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-medium">
                {item.value} (
                {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
export default function AnalyticsDashboard() {
  const [selectedProfile, setSelectedProfile] = useState<string>("all");

  const analyticsData = useQuery(api.analytics.getAnalyticsData);
  const monthlyCostData = useQuery(api.analytics.getMonthlyCostData);
  const billStatusData = useQuery(api.analytics.getBillStatusDistribution);
  const profilesData = useQuery(api.profiles.getProfilesForUser);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (!analyticsData || !monthlyCostData || !billStatusData || !profilesData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (
    !analyticsData.success ||
    !monthlyCostData.success ||
    !billStatusData.success ||
    !profilesData.success
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading analytics data</p>
          <p className="text-muted-foreground">
            {analyticsData.error ||
              monthlyCostData.error ||
              billStatusData.error ||
              profilesData.error}
          </p>
        </div>
      </div>
    );
  }

  const stats = analyticsData.data!;
  const monthlyData = monthlyCostData.data!;
  const statusData = billStatusData.data!;
  const profiles = profilesData.data || [];

  const filteredMonthlyData =
    selectedProfile === "all"
      ? monthlyData.monthlyData
      : monthlyData.monthlyData.map((item) => ({
          month: item.month,
          [selectedProfile]: item[selectedProfile] || 0,
          total: (item[selectedProfile] as number) || 0,
        }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive overview of your bills and expenses across all profiles
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Profiles"
          value={stats.totalProfiles}
          icon={<Users className="h-4 w-4 text-primary" />}
          description="Active billing profiles"
        />
        <StatCard
          title="Total Bills"
          value={stats.totalBills}
          icon={<FileText className="h-4 w-4 text-primary" />}
          description="Recurring bill types"
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmount)}
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          description="All bill instances"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.unpaidAmount)}
          icon={<Calculator className="h-4 w-4 text-primary" />}
          description="Unpaid bills amount"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Paid Bills"
          value={stats.paidBillInstances}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          description={`${formatCurrency(stats.paidAmount)} total`}
        />
        <StatCard
          title="Unpaid Bills"
          value={stats.unpaidBillInstances}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
          description={`${formatCurrency(stats.unpaidAmount)} remaining`}
        />
        <StatCard
          title="Payment Rate"
          value={`${stats.totalBillInstances > 0 ? ((stats.paidBillInstances / stats.totalBillInstances) * 100).toFixed(1) : 0}%`}
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          description="Bills paid on time"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="profiles">Profile Analysis</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <MonthlyCostChart
                data={filteredMonthlyData}
                profiles={monthlyData.profiles}
                selectedProfile={selectedProfile}
                onProfileSelect={setSelectedProfile}
              />
            </div>
            <div className="xl:col-span-1">
              <BillStatusChart data={statusData} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <MonthlyComparison
            data={monthlyData.monthlyData}
            profiles={monthlyData.profiles}
          />
        </TabsContent>

        <TabsContent value="profiles">
          <ProfileAnalytics profiles={profiles} />
        </TabsContent>

        <TabsContent value="activity">
          <RecentActivity />
        </TabsContent>
      </Tabs>
    </div>
  );
}
