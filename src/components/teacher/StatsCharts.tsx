import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BookOpen, FileStack, ClipboardList, Users, TrendingUp } from 'lucide-react';

interface StatsChartsProps {
  stats: {
    lessons: number;
    summaries: number;
    exercises: number;
    announcements: number;
  };
  studentsByLevel: {
    baccalaureate: number;
    second_year: number;
  };
}

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(25, 95%, 53%)', 'hsl(280, 67%, 53%)'];

export function StatsCharts({ stats, studentsByLevel }: StatsChartsProps) {
  const contentData = useMemo(() => [
    { name: 'الدروس', value: stats.lessons, color: COLORS[0] },
    { name: 'الملخصات', value: stats.summaries, color: COLORS[1] },
    { name: 'التمارين', value: stats.exercises, color: COLORS[2] },
  ], [stats]);

  const studentData = useMemo(() => [
    { name: 'البكالوريا', value: studentsByLevel.baccalaureate, fill: 'hsl(221, 83%, 53%)' },
    { name: 'الثانية ثانوي', value: studentsByLevel.second_year, fill: 'hsl(280, 67%, 53%)' },
  ], [studentsByLevel]);

  const totalContent = stats.lessons + stats.summaries + stats.exercises;
  const totalStudents = studentsByLevel.baccalaureate + studentsByLevel.second_year;

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      {/* Content Distribution */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">توزيع المحتوى</h3>
          <span className="text-xs text-muted-foreground mr-auto">({totalContent} إجمالي)</span>
        </div>
        
        {totalContent > 0 ? (
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {contentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {contentData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">لا يوجد محتوى</p>
        )}
      </div>

      {/* Students by Level */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">توزيع الطلاب</h3>
          <span className="text-xs text-muted-foreground mr-auto">({totalStudents} إجمالي)</span>
        </div>
        
        {totalStudents > 0 ? (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value} طالب`, '']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">لا يوجد طلاب</p>
        )}
      </div>
    </div>
  );
}