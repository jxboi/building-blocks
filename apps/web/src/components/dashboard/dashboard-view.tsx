import type { Route } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleGauge,
  Clock3,
  FileCheck2,
  ListTodo,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const chartData = [
  { label: "2 Jun", completed: 16, created: 21 },
  { label: "9 Jun", completed: 22, created: 20 },
  { label: "16 Jun", completed: 20, created: 26 },
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
  { initials: "MC", person: "Maya Chen", action: "approved", object: "Security review", time: "14 min ago", dateTime: "2026-07-21T09:46:00+08:00", status: "complete" as const },
  { initials: "JO", person: "Jon Okafor", action: "moved", object: "Partner access", time: "41 min ago", dateTime: "2026-07-21T09:19:00+08:00", status: "active" as const },
  { initials: "SL", person: "Sam Lee", action: "commented on", object: "Q3 budget", time: "1 hr ago", dateTime: "2026-07-21T09:00:00+08:00", status: "pending" as const },
  { initials: "AK", person: "Ari Kim", action: "completed", object: "Launch checklist", time: "2 hr ago", dateTime: "2026-07-21T08:00:00+08:00", status: "complete" as const },
] as const;

const upcoming = [
  { time: "11:30", title: "Design QA", detail: "Growth experiment", icon: Sparkles },
  { time: "14:00", title: "Access review", detail: "Security & Legal", icon: ShieldCheck },
  { time: "16:30", title: "Quarterly planning", detail: "Product leadership", icon: UsersRound },
] as const;

export async function DashboardView({
  demo = false,
  workspace = "acme",
}: {
  demo?: boolean;
  workspace?: string;
}) {
  const t = await getTranslations();
  const approvalsHref = (demo ? "/demo#attention" : `/${workspace}/approvals`) as Route;
  const notificationsHref = (demo ? "/demo#activity" : `/${workspace}/notifications`) as Route;

  return (
    <>
      <BannerSlot demo={demo} />
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        breadcrumbs={[{ label: "Product" }, { label: "Overview" }]}
        actions={
          demo ? (
            <>
              <Button variant="outline" asChild>
                <Link href={notificationsHref}>
                  <Activity className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">View activity</span>
                  <span className="sm:hidden">Activity</span>
                </Link>
              </Button>
              <Button asChild>
                <Link href={approvalsHref}>
                  <FileCheck2 className="size-4" aria-hidden="true" />
                  Review approvals
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" aria-label={t("dashboard.customizeAction")}>
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("dashboard.customizeAction")}</span>
              </Button>
              <Button>
                <Plus className="size-4" aria-hidden="true" />
                {t("dashboard.createAction")}
              </Button>
            </>
          )
        }
      />

      <div className="page-enter-delayed mx-auto grid max-w-6xl gap-5 px-4 pb-10 pt-1 md:gap-6 md:px-8 md:pb-12 md:pt-2">
        <Card className="relative overflow-hidden py-0">
          <div className="surface-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
          <CardContent className="relative grid gap-5 px-5 py-5 md:grid-cols-3 md:px-6 md:py-6">
            <div className="flex items-start gap-4 md:col-span-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace pulse</p>
                  <Badge variant="outline" className="border-success/25 bg-success/10 text-success">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    On track
                  </Badge>
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">A strong start to the week</h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Your team completed more work than it created, while overdue approvals fell for the second week in a row.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-background/80 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Weekly completion goal</p>
                  <p className="mt-1 text-sm font-medium">39 of 50 items</p>
                </div>
                <span className="font-mono text-sm font-medium tabular-nums">78%</span>
              </div>
              <Progress value={78} aria-label="Weekly completion goal: 78 percent" className="mt-3" />
              <p className="mt-2.5 text-xs text-muted-foreground">11 more completions to hit the team target.</p>
            </div>
          </CardContent>
        </Card>

        <section
          className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Workspace metrics"
        >
          <StatTile label={t("dashboard.metricActive")} value="148" detail={t("dashboard.metricActiveDetail")} icon={ListTodo} trend="neutral" />
          <StatTile label={t("dashboard.metricApprovals")} value="9" detail={t("dashboard.metricApprovalsDetail")} icon={Clock3} trend="down" />
          <StatTile label={t("dashboard.metricCycle")} value="3.4d" detail={t("dashboard.metricCycleDetail")} icon={CircleGauge} />
          <StatTile label={t("dashboard.metricAutomations")} value="99.2%" detail={t("dashboard.metricAutomationsDetail")} icon={Bot} />
        </section>

        <section className="grid gap-5 xl:grid-cols-3" aria-label="Performance and approvals">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>
                  <h2 className="text-sm">{t("dashboard.activityTitle")}</h2>
                </CardTitle>
                <CardDescription>{t("dashboard.activityDescription")}</CardDescription>
              </div>
              <DateRangePicker />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Completed this week</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">39</span>
                    <Badge variant="outline" className="border-success/25 bg-success/10 text-success">+22%</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground" aria-label="Chart legend">
                  <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-chart-1" />Completed</span>
                  <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-chart-2" />Created</span>
                </div>
              </div>
              <TimeSeriesChart data={chartData} />
            </CardContent>
            <CardFooter className="gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-success" strokeWidth={1.8} aria-hidden="true" />
              Completion pace is ahead of incoming work by 7 items.
            </CardFooter>
          </Card>

          <Card id="attention" className="scroll-mt-20">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-3.5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
                  <CardTitle>
                    <h2 className="text-sm">{t("dashboard.attentionTitle")}</h2>
                  </CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-normal">9 open</Badge>
              </div>
              <CardDescription>{t("dashboard.attentionDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-xs leading-5 text-warning">
                <span className="font-medium">3 approvals</span> have been waiting longer than 48 hours.
              </div>
              <BarList items={attentionItems} />
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                <Link href={approvalsHref}>
                  Review approvals
                  <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-3" aria-label="Recent workspace activity">
          <Card id="activity" className="scroll-mt-20 xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>
                  <h2 className="text-sm">{t("dashboard.recentTitle")}</h2>
                </CardTitle>
                <CardDescription>Permission-aware events from this workspace.</CardDescription>
              </div>
              <Activity className="size-4 text-muted-foreground/70" strokeWidth={1.8} aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <ol>
                {activity.map((item, index) => (
                  <li key={`${item.person}-${item.object}`}>
                    <div className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/30">
                      <Avatar className="size-8">
                        <AvatarFallback className="font-mono text-xs">{item.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          <span className="font-medium">{item.person}</span>{" "}
                          <span className="text-muted-foreground">{item.action}</span>{" "}
                          <span className="font-medium">{item.object}</span>
                        </p>
                        <time className="mt-0.5 block font-mono text-xs text-muted-foreground sm:hidden" dateTime={item.dateTime}>
                          {item.time}
                        </time>
                      </div>
                      <div className="hidden sm:block">
                        <StatusBadge status={item.status} />
                      </div>
                      <time className="hidden min-w-20 text-right font-mono text-xs text-muted-foreground md:block" dateTime={item.dateTime}>
                        {item.time}
                      </time>
                    </div>
                    {index < activity.length - 1 ? <Separator /> : null}
                  </li>
                ))}
              </ol>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild>
                <Link href={notificationsHref}>
                  <CheckCircle2 className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                  {t("dashboard.viewAll")}
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-3.5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
                  <CardTitle>
                    <h2 className="text-sm">Up next</h2>
                  </CardTitle>
                </div>
                <Badge variant="secondary">Today</Badge>
              </div>
              <CardDescription>Your remaining team touchpoints.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid divide-y divide-border/70">
                {upcoming.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={`${item.time}-${item.title}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <time className="w-12 shrink-0 pt-1 font-mono text-xs text-muted-foreground" dateTime={`2026-07-21T${item.time}:00+08:00`}>
                        {item.time}
                      </time>
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Icon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
