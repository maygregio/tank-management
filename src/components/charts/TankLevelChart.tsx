'use client';

import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Paper, Typography } from '@mui/material';
import { format, addDays, isAfter, parseISO, startOfDay } from 'date-fns';
import { Tank, Movement, isMovementCompleted } from '@/types';
import { getVolumeChange } from '@/services/tankCalculations';

interface TankLevelChartProps {
  tank: Tank;
  movements: Movement[];
  horizonDays: number;
}

interface ChartDataPoint {
  date: Date;
  volume: number;
  movement?: Movement;
  isProjected: boolean;
}

export default function TankLevelChart({
  tank,
  movements,
  horizonDays,
}: TankLevelChartProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const endDate = addDays(today, horizonDays);

    // Get scheduled movements within horizon
    const scheduledMovements = movements
      .filter((m) => !isMovementCompleted(m))
      .filter((m) => {
        const schedDate = parseISO(m.scheduledDate);
        return !isAfter(schedDate, endDate);
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    // Build timeline data points
    const dataPoints: ChartDataPoint[] = [];

    // Start with current tank volume at today
    dataPoints.push({
      date: today,
      volume: tank.currentVolume,
      isProjected: false,
    });

    // Add projected points for each scheduled movement
    let projectedVolume = tank.currentVolume;
    scheduledMovements.forEach((movement) => {
      const moveDate = startOfDay(parseISO(movement.scheduledDate));

      // Calculate volume change using shared function
      const volumeChange = getVolumeChange(movement, tank.id);

      if (volumeChange !== 0) {
        projectedVolume += volumeChange;
        dataPoints.push({
          date: moveDate,
          volume: Math.max(0, projectedVolume),
          movement,
          isProjected: true,
        });
      }
    });

    // Add end date point if no movement on that day
    const lastPoint = dataPoints[dataPoints.length - 1];
    if (lastPoint.date.getTime() !== endDate.getTime()) {
      dataPoints.push({
        date: endDate,
        volume: projectedVolume,
        isProjected: true,
      });
    }

    return dataPoints;
  }, [tank, movements, horizonDays]);

  // Prepare data for Highcharts
  const volumeData = chartData.map((point) => ({
    x: point.date.getTime(),
    y: point.volume,
    marker: point.movement
      ? {
          enabled: true,
          radius: 8,
          fillColor: point.movement.type === 'receive'
            ? '#4caf50'
            : point.movement.type === 'ship'
            ? '#f44336'
            : '#2196f3',
        }
      : undefined,
    movement: point.movement,
  }));

  // Prepare movement bars data
  const movementBars = chartData
    .filter((point) => point.movement)
    .map((point) => {
      const movement = point.movement!;
      const volumeChange = getVolumeChange(movement, tank.id);

      return {
        x: point.date.getTime(),
        y: volumeChange,
        color: volumeChange >= 0 ? '#4caf50' : '#f44336',
        movement,
      };
    });

  const options: Highcharts.Options = {
    chart: {
      type: 'line',
      height: 350,
      style: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
    },
    title: {
      text: undefined,
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Date',
      },
      plotLines: [
        {
          color: '#1976d2',
          width: 2,
          value: new Date().getTime(),
          dashStyle: 'Dash',
          label: {
            text: 'Today',
            style: {
              color: '#1976d2',
            },
          },
        },
      ],
    },
    yAxis: [
      {
        title: {
          text: 'Volume (KB)',
        },
        min: 0,
      },
      {
        title: {
          text: 'Movement (KB)',
        },
        opposite: true,
      },
    ],
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function (): string {
        const ctx = this as unknown as { points?: Array<{ series: { name: string }; y?: number; point: { movement?: Movement } }>; x?: number };
        const points = ctx.points || [];
        let tooltip = `<b>${format(new Date(ctx.x as number), 'MMM d, yyyy')}</b><br/>`;

        points.forEach((point) => {
          if (point.series.name === 'Tank Volume') {
            tooltip += `Volume: <b>${point.y?.toFixed(1)} KB</b><br/>`;
          } else if (point.series.name === 'Movements') {
            const movement = point.point.movement;
            if (movement) {
              const type = movement.type.charAt(0).toUpperCase() + movement.type.slice(1);
              tooltip += `${type}: <b>${(point.y ?? 0) > 0 ? '+' : ''}${point.y?.toFixed(1)} KB</b><br/>`;
              if (movement.carrier) {
                tooltip += `Carrier: ${movement.carrier}<br/>`;
              }
            }
          }
        });

        return tooltip;
      },
    },
    legend: {
      enabled: true,
    },
    plotOptions: {
      series: {
        animation: false,
      },
      line: {
        step: 'left',
      },
    },
    series: [
      {
        name: 'Tank Volume',
        type: 'line',
        data: volumeData,
        color: '#1976d2',
        lineWidth: 2,
        zoneAxis: 'x',
        zones: [
          {
            value: new Date().getTime(),
            dashStyle: 'Solid',
          },
          {
            dashStyle: 'Dash',
          },
        ],
      },
      {
        name: 'Movements',
        type: 'column',
        yAxis: 1,
        data: movementBars,
        borderRadius: 3,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Volume Projection
      </Typography>
      <HighchartsReact highcharts={Highcharts} options={options} />
      {chartData.filter((d) => d.movement).length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', mt: 2 }}
        >
          No scheduled movements within the selected horizon
        </Typography>
      )}
    </Paper>
  );
}
