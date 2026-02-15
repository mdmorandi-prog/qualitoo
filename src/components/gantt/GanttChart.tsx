import { useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Diamond, CheckCircle2 } from "lucide-react";

interface GanttTask {
  id: string;
  title: string;
  responsible?: string | null;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
  is_milestone?: boolean;
  depends_on?: string | null;
}

interface GanttChartProps {
  tasks: GanttTask[];
  projectStart: string;
  projectEnd: string;
}

const statusColors: Record<string, string> = {
  pendente: "hsl(var(--muted-foreground))",
  em_andamento: "hsl(var(--primary))",
  concluida: "hsl(142 71% 45%)",
  atrasada: "hsl(0 84% 60%)",
  cancelada: "hsl(var(--muted-foreground))",
};

const GanttChart = ({ tasks, projectStart, projectEnd }: GanttChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { days, months, startDate } = useMemo(() => {
    const start = new Date(projectStart + "T00:00:00");
    const end = new Date(projectEnd + "T00:00:00");
    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1, 7);

    const monthsArr: { label: string; days: number; startDay: number }[] = [];
    let cursor = new Date(start);
    let dayCount = 0;

    while (dayCount < totalDays) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dayOfMonth = cursor.getDate();
      const remaining = daysInMonth - dayOfMonth + 1;
      const span = Math.min(remaining, totalDays - dayCount);

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      monthsArr.push({
        label: `${monthNames[month]} ${year}`,
        days: span,
        startDay: dayCount,
      });

      dayCount += span;
      cursor = new Date(year, month + 1, 1);
    }

    return { days: totalDays, months: monthsArr, startDate: start };
  }, [projectStart, projectEnd]);

  const dayWidth = Math.max(28, 900 / days);

  const getTaskPosition = (task: GanttTask) => {
    const tStart = new Date(task.start_date + "T00:00:00");
    const tEnd = new Date(task.end_date + "T00:00:00");
    const startDay = Math.max(0, (tStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const endDay = Math.min(days, (tEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1);
    return { left: startDay * dayWidth, width: Math.max((endDay - startDay) * dayWidth, 4) };
  };

  const isOverdue = (task: GanttTask) => {
    if (task.status === "concluida" || task.status === "cancelada") return false;
    return new Date(task.end_date) < new Date();
  };

  const today = new Date();
  const todayOffset = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const showTodayLine = todayOffset >= 0 && todayOffset <= days;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div ref={containerRef} className="overflow-x-auto">
        <div style={{ minWidth: 280 + days * dayWidth }}>
          {/* Header - Months */}
          <div className="flex border-b bg-muted/30">
            <div className="w-[280px] min-w-[280px] border-r px-3 py-2 text-xs font-semibold text-muted-foreground">
              Tarefa
            </div>
            <div className="flex relative">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="border-r px-2 py-2 text-xs font-semibold text-muted-foreground text-center"
                  style={{ width: m.days * dayWidth }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhuma tarefa cadastrada. Adicione tarefas ao projeto.
            </div>
          ) : (
            tasks.map((task, idx) => {
              const pos = getTaskPosition(task);
              const overdue = isOverdue(task);
              const barColor = overdue ? statusColors.atrasada : statusColors[task.status] || statusColors.pendente;

              return (
                <div key={task.id} className="flex border-b last:border-b-0 hover:bg-muted/20 transition-colors group">
                  {/* Task label */}
                  <div className="w-[280px] min-w-[280px] border-r px-3 py-2 flex items-center gap-2">
                    {task.is_milestone ? (
                      <Diamond className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: barColor }} />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{task.title}</p>
                      {task.responsible && (
                        <p className="text-[10px] text-muted-foreground truncate">{task.responsible}</p>
                      )}
                    </div>
                    {overdue && (
                      <Badge variant="destructive" className="text-[9px] h-4 ml-auto shrink-0">
                        Atrasada
                      </Badge>
                    )}
                  </div>

                  {/* Gantt bar area */}
                  <div className="relative flex-1" style={{ height: 40 }}>
                    {/* Grid lines */}
                    {months.map((m, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-r border-dashed border-border/30"
                        style={{ left: (m.startDay + m.days) * dayWidth }}
                      />
                    ))}

                    {/* Today line */}
                    {showTodayLine && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10"
                        style={{ left: todayOffset * dayWidth }}
                      />
                    )}

                    {/* Bar or milestone */}
                    {task.is_milestone ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-1/2 -translate-y-1/2 z-20"
                            style={{ left: pos.left + pos.width / 2 - 8 }}
                          >
                            <Diamond className="h-4 w-4 text-amber-500 fill-amber-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs">{new Date(task.end_date).toLocaleDateString("pt-BR")}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-5 rounded-full z-20 cursor-default transition-all group-hover:h-6"
                            style={{
                              left: pos.left,
                              width: pos.width,
                              backgroundColor: `${barColor}33`,
                              border: `1.5px solid ${barColor}`,
                            }}
                          >
                            {/* Progress fill */}
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${task.progress}%`,
                                backgroundColor: barColor,
                                opacity: 0.7,
                              }}
                            />
                            {/* Progress text */}
                            {pos.width > 40 && (
                              <span
                                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                                style={{ color: task.progress > 50 ? "#fff" : barColor }}
                              >
                                {task.progress}%
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs">
                            {new Date(task.start_date).toLocaleDateString("pt-BR")} →{" "}
                            {new Date(task.end_date).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-xs">Progresso: {task.progress}%</p>
                          {task.responsible && <p className="text-xs">Resp: {task.responsible}</p>}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 border-t bg-muted/20 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full" style={{ backgroundColor: statusColors.pendente }} /> Pendente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full" style={{ backgroundColor: statusColors.em_andamento }} /> Em andamento</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full" style={{ backgroundColor: statusColors.concluida }} /> Concluída</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full" style={{ backgroundColor: statusColors.atrasada }} /> Atrasada</span>
        <span className="flex items-center gap-1"><Diamond className="h-3 w-3 text-amber-500" /> Marco</span>
        {showTodayLine && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary/60" /> Hoje</span>}
      </div>
    </div>
  );
};

export default GanttChart;
