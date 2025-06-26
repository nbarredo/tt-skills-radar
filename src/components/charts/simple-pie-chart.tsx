interface SimplePieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  size?: number;
}

export function SimplePieChart({
  data,
  title,
  size = 200,
}: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  // Calculate cumulative percentages for positioning
  let cumulativePercentage = 0;
  const dataWithAngles = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = cumulativePercentage * 3.6; // Convert to degrees
    cumulativePercentage += percentage;

    return {
      ...item,
      percentage,
      startAngle,
      color: item.color || colors[index % colors.length],
    };
  });

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <div className="flex items-center gap-6">
        {/* Simple donut chart using conic-gradient */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: size,
            height: size,
            background: `conic-gradient(${dataWithAngles
              .map((item, index) => {
                const endPercentage = dataWithAngles
                  .slice(0, index + 1)
                  .reduce((sum, d) => sum + d.percentage, 0);
                const startPercentage =
                  index === 0
                    ? 0
                    : dataWithAngles
                        .slice(0, index)
                        .reduce((sum, d) => sum + d.percentage, 0);
                return `${item.color} ${startPercentage}% ${endPercentage}%`;
              })
              .join(", ")})`,
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-full flex items-center justify-center"
            style={{ width: size * 0.6, height: size * 0.6 }}
          >
            <span className="text-sm font-medium">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {dataWithAngles.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
