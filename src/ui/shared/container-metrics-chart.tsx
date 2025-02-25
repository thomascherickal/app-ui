import { ChartToCreate, selectMetricDataByChart } from "@app/metric-tunnel";
import { useSelector } from "@app/react";
import { DeployContainer, MetricHorizons } from "@app/types";
import {
  CategoryScale,
  Chart as ChartJS,
  Colors,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  TimeUnit,
  Title,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-luxon";
import { Line } from "react-chartjs-2";
import { IconInfo } from "./icons";
import { Tooltip as AptibleTooltip } from "./tooltip";

ChartJS.register(
  CategoryScale,
  Colors,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
);

const timeHorizonToChartJSUnit = (metricHorizon: MetricHorizons): TimeUnit =>
  ({
    "1h": "minute" as TimeUnit,
    "1d": "minute" as TimeUnit,
    "1w": "day" as TimeUnit,
  })[metricHorizon];

const LineChartWrapper = ({
  showLegend = true,
  keyId,
  chart: { labels, datasets, title },
  xAxisUnit,
  yAxisLabel,
  yAxisUnit,
}: {
  showLegend?: boolean;
  keyId: string;
  chart: ChartToCreate;
  xAxisUnit: TimeUnit;
  yAxisLabel?: string;
  yAxisUnit?: string;
}) =>
  datasets && title ? (
    <Line
      datasetIdKey={keyId}
      data={{
        labels,
        datasets,
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0,
          easing: "linear",
        },
        plugins: {
          colors: {
            forceOverride: true, // needed to persist colors during repaint/refresh
          },
          legend: {
            display: showLegend,
            labels: {
              usePointStyle: true,
              boxHeight: 5,
              boxWidth: 3,
              padding: 20,
            },
          },
          title: {
            font: {
              size: 16,
              weight: "normal",
            },
            color: "#595E63",
            align: "start",
            display: true,
            text: title,
            padding: showLegend
              ? undefined
              : {
                  top: 10,
                  bottom: 30,
                },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "xy",
          intersect: false,
        },
        scales: {
          x: {
            border: {
              color: "#111920",
            },
            grid: {
              display: false,
            },
            ticks: {
              color: "#111920",
              maxRotation: 0,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 5,
            },
            adapters: {
              date: {
                zone: "UTC",
              },
            },
            time: {
              tooltipFormat: "yyyy-MM-dd HH:mm:ss 'UTC'",
              unit: xAxisUnit,
              displayFormats: {
                minute: "HH:mm 'UTC'",
                day: "MMM dd",
              },
            },
            type: "time",
          },
          y: {
            min: 0,
            border: {
              display: false,
            },
            title: yAxisLabel
              ? {
                  display: true,
                  text: yAxisLabel,
                }
              : undefined,
            ticks: {
              callback: yAxisUnit
                ? (value, idx, values) => `${value}${yAxisUnit}`
                : undefined,
              color: "#111920",
            },
          },
        },
      }}
    />
  ) : null;

export const ContainerMetricsChart = ({
  containers,
  limit,
  metricNames,
  metricHorizon,
  helpText,
  yAxisLabel,
  yAxisUnit,
}: {
  containers: DeployContainer[];
  limit?: string;
  metricNames: string[];
  metricHorizon: MetricHorizons;
  helpText?: string;
  yAxisLabel?: string;
  yAxisUnit?: string;
}) => {
  const containerIds = containers.map((container) => container.id).sort();
  // for now, we only use the FIRST container id pending cross-release
  const chartToCreate = useSelector((s) =>
    selectMetricDataByChart(s, {
      containerIds,
      metricNames,
      metricHorizon,
    }),
  );
  if (chartToCreate.title === "" || chartToCreate.datasets?.length === 0) {
    return null;
  }

  return (
    <div className="bg-white px-5 pt-1 pb-5 shadow rounded-lg border border-black-100 relative min-h-[400px] bg-[url('/thead-bg.png')] bg-[length:100%_46px] bg-no-repeat">
      {helpText || limit ? (
        <div className="relative w-full">
          <div className="flex absolute right-0 top-2.5 gap-2">
            {limit ? (
              <span className="text-sm text-gray-500 top-2.5">
                Limit: {limit}
              </span>
            ) : null}
            {helpText ? (
              <div className="right-5 top-2.5">
                <AptibleTooltip text={helpText}>
                  <IconInfo className="h-5 mt-0.5 opacity-50 hover:opacity-100 cursor-pointer" />
                </AptibleTooltip>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <LineChartWrapper
        showLegend={(chartToCreate.datasets?.length || 0) <= 4}
        keyId={`${containerIds.join("-")}-${metricNames.join(
          "-",
        )}-${metricHorizon}`}
        xAxisUnit={timeHorizonToChartJSUnit(metricHorizon)}
        yAxisLabel={yAxisLabel}
        yAxisUnit={yAxisUnit}
        chart={chartToCreate}
      />
    </div>
  );
};
