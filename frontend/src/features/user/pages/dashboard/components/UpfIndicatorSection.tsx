import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { healthMetrics } from '../constants/mockUpfData';

//ultra processed food
export function UPFIndicatorSection() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardDescription>Ultra Processed Food Tracking</CardDescription>
      </CardHeader>
      <CardContent className="w-full h-full">
        <div className="flex flex-row justify-between items-center p-0 w-full">
          {healthMetrics.map((item) => (
            <div
              key={item.nutrient}
              className="flex flex-col items-center flex-1 min-w-0 aspect-square"
            >
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={8}
                    data={[item]}
                    startAngle={90}
                    endAngle={450}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, item.limit]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar background dataKey="value" cornerRadius={5} fill={item.fill} />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground text-[10px] font-bold"
                    >
                      {`${item.value}%`}
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1 truncate w-full text-center">
                {item.nutrient}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
