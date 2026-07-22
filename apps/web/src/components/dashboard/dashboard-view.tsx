import { Activity, ArrowRight, Bot, CheckCircle2, CircleGauge, Clock3, ListTodo, Plus, SlidersHorizontal } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BarList } from "@/components/kit/dashboard/bar-list";
import { DateRangePicker } from "@/components/kit/dashboard/date-range-picker";
import { StatTile } from "@/components/kit/dashboard/stat-tile";
import { TimeSeriesChart } from "@/components/kit/dashboard/time-series-chart";
import { StatusBadge } from "@/components/kit/status-badge";
import { BannerSlot } from "@/components/layout/banner-slot";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const chartData = [
  { label: "23 Jun", completed: 18, created: 24 },
  { label: "30 Jun", completed: 26, created: 28 },
  { label: "7 Jul", completed: 31, created: 25 },
  { label: "14 Jul", completed: 28, created: 34 },
  { label: "21 Jul", completed: 39, created: 32 },
] as const;

const attentionItems = [
  { label: "Security review", detail: "Waiting 3d", value: 12 },
  { label: "Partner access", detail: "Waiting 2d", value: 8 },
  { label: "Q3 budget", detail: "Waiting 18h", value: 5 },
] as const;

const activity = [
  { initials: "MC", person: "Maya Chen", action: "approved", object: "Security review", time: "14 min", status: "complete" as const },
  { initials: "JO", person: "Jon Okafor", action: "moved", object: "Partner access", time: "41 min", status: "active" as const },
  { initials: "SL", person: "Sam Lee", action: "commented on", object: "Q3 budget", time: "1 hr", status: "pending" as const },
] as const;

export async function DashboardView({ demo = false }: { demo?: boolean }) {
  const t = await getTranslations();

  return (
    <>
      <BannerSlot demo={demo} />
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        breadcrumbs={[{ label: "Product" }, { label: "Overview" }]}
        actions={
          <>
            <Button variant="outline" aria-label={t("dashboard.customizeAction")}>
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">{t("dashboard.customizeAction")}</span>
            </Button>
            <Button>
              <Plus className="size-4" />
              {t("dashboard.createAction")}
            </Button>
          </>
        }
      />
      <div className="page-enter-delayed mx-auto grid max-w-6xl gap-5 px-4 pb-8 pt-1 md:px-8 md:pb-10 md:pt-2">
        <section className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 shadow-xs sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace metrics">
          <StatTile label={t("dashboard.metricActive")} value="148" detail={t("dashboard.metricActiveDetail")} icon={ListTodo} trend="neutral" />
          <StatTile label={t("dashboard.metricApprovals")} value="9" detail={t("dashboard.metricApprovalsDetail")} icon={Clock3} trend="down" />
          <StatTile label={t("dashboard.metricCycle")} value="3.4d" detail={t("dashboard.metricCycleDetail")} icon={CircleGauge} />
          <StatTile label={t("dashboard.metricAutomations")} value="99.2%" detail={t("dashboard.metricAutomationsDetail")} icon={Bot} />
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-sm">{t("dashboard.activityTitle")}</CardTitle>
                <CardDescription>{t("dashboard.activityDescription")}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex" aria-label="Chart legend">
                  <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-chart-1" />Completed</span>
                  <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-chart-2" />Created</span>
                </div>
                <DateRangePicker />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <TimeSeriesChart data={chartData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-3.5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
                  <CardTitle className="text-sm">{t("dashboard.attentionTitle")}</CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-normal">9 open</Badge>
              </div>
              <CardDescription>{t("dashboard.attentionDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList items={attentionItems} />
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Review approvals
                <ArrowRight className="size-3.5" strokeWidth={1.8} />
              </Button>
            </CardFooter>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm">{t("dashboard.recentTitle")}</CardTitle>
              <CardDescription>Permission-aware events from this workspace.</CardDescription>
            </div>
            <Activity className="size-4 text-muted-foreground/70" strokeWidth={1.8} aria-hidden="true" />
          </CardHeader>
          <CardContent className="grid gap-0">
            {activity.map((item, index) => (
              <div key={`${item.person}-${item.object}`}>
                <div className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/30">
                  <Avatar className="size-8">
                    <AvatarFallback className="font-mono text-xs">{item.initials}</AvatarFallback>
                  </Avatar>
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{item.person}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>{" "}
                    <span className="font-medium">{item.object}</span>
                  </p>
                  <StatusBadge status={item.status} />
                  <time className="hidden min-w-12 text-right font-mono text-xs text-muted-foreground sm:block">{item.time}</time>
                </div>
                {index < activity.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm">
              <CheckCircle2 className="size-3.5" strokeWidth={1.8} />
              {t("dashboard.viewAll")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
