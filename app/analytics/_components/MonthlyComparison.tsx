"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MonthlyComparisonProps {
  data: Array<{ month: string; total: number; [key: string]: number | string }>;
  profiles: string[];
}

function MonthlyComparison({ data, profiles }: MonthlyComparisonProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatMonth = (month: string) => {
    try {
      // Handle different date formats
      if (!month || typeof month !== "string") return "Invalid";

      // If already in a readable format, return as is
      if (month.includes("-")) {
        const parts = month.split("-");
        if (parts.length !== 2) return month;

        const [year, monthNum] = parts;
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

  // Create chart colors
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

  // Calculate month-over-month growth
  const calculateGrowth = () => {
    if (data.length < 2) return null;

    const current = data[data.length - 1];
    const previous = data[data.length - 2];

    if (!current || !previous) return null;

    const currentTotal = current.total;
    const previousTotal = previous.total;

    if (previousTotal === 0) return null;

    const growth = ((currentTotal - previousTotal) / previousTotal) * 100;
    return {
      value: Math.abs(growth),
      isPositive: growth > 0,
      currentMonth: formatMonth(current.month),
      previousMonth: formatMonth(previous.month),
    };
  };

  const growth = calculateGrowth();

  // Find highest spending month
  const highestMonth = data.reduce(
    (max, current) => (current.total > max.total ? current : max),
    data[0] || { month: "", total: 0 },
  );

  // Calculate average monthly spending
  const averageSpending =
    data.reduce((sum, item) => sum + item.total, 0) / data.length;

  return (
    <div className="space-y-6">
      {/* Monthly Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Month-over-Month
                </p>
                {growth ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">
                      {growth.value.toFixed(1)}%
                    </span>
                    {growth.isPositive ? (
                      <ArrowUpIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ) : (
                  <span className="text-lg font-bold">N/A</span>
                )}
                {growth && (
                  <p className="text-xs text-muted-foreground">
                    {growth.currentMonth} vs {growth.previousMonth}
                  </p>
                )}
              </div>
              <Badge variant={growth?.isPositive ? "destructive" : "default"}>
                {growth?.isPositive ? "Increase" : "Decrease"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Highest Month</p>
              <p className="text-lg font-bold">
                {formatCurrency(highestMonth.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatMonth(highestMonth.month)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Monthly</p>
              <p className="text-lg font-bold">
                {formatCurrency(averageSpending)}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.length} month{data.length !== 1 ? "s" : ""} average
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="area" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="area">Area Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="area">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trends</CardTitle>
              <p className="text-sm text-muted-foreground">
                Area chart showing spending patterns over time
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    labelFormatter={(month: string) =>
                      `Month: ${formatMonth(month)}`
                    }
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name,
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending by Profile</CardTitle>
              <p className="text-sm text-muted-foreground">
                Stacked bar chart showing spending breakdown by profile
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    labelFormatter={(month: string) =>
                      `Month: ${formatMonth(month)}`
                    }
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name,
                    ]}
                  />
                  <Legend />
                  {profiles.map((profile, index) => (
                    <Bar
                      key={profile}
                      dataKey={profile}
                      stackId="profiles"
                      fill={COLORS[(index % COLORS.length) + 1]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default MonthlyComparison;
