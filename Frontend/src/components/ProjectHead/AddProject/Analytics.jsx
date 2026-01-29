import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("month"); // week, month, quarter, year
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalEmployees: 0,
    avgCompletionRate: 0,
  });

  const [projectTrends, setProjectTrends] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [taskDistribution, setTaskDistribution] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    trends: true,
    performance: true,
    distribution: true,
    recent: true,
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch summary stats
      const statsResponse = await fetch(`${API_URL}/projects/stats/summary`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(prev => ({
          ...prev,
          ...statsData.data,
        }));
      }

      // Fetch project trends
      const trendsResponse = await fetch(`${API_URL}/analytics/project-trends?range=${timeRange}`);
      const trendsData = await trendsResponse.json();
      if (trendsData.success) {
        setProjectTrends(trendsData.data);
      }

      // Fetch department performance
      const deptResponse = await fetch(`${API_URL}/analytics/department-performance?range=${timeRange}`);
      const deptData = await deptResponse.json();
      if (deptData.success) {
        setDepartmentPerformance(deptData.data);
      }

      // Fetch top performers
      const performersResponse = await fetch(`${API_URL}/analytics/top-performers?range=${timeRange}`);
      const performersData = await performersResponse.json();
      if (performersData.success) {
        setTopPerformers(performersData.data);
      }

      // Fetch task distribution
      const distributionResponse = await fetch(`${API_URL}/analytics/task-distribution?range=${timeRange}`);
      const distributionData = await distributionResponse.json();
      if (distributionData.success) {
        setTaskDistribution(distributionData.data);
      }

      // Fetch recent activities
      const activitiesResponse = await fetch(`${API_URL}/analytics/recent-activities?limit=10`);
      const activitiesData = await activitiesResponse.json();
      if (activitiesData.success) {
        setRecentActivities(activitiesData.data);
      }

    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const exportAnalytics = () => {
    // Export functionality
    console.log("Exporting analytics...");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm h-[100%] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-[0.8vw] border-b border-gray-200">
        <div>
          <h1 className="text-[1.2vw] font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-[0.85vw] text-gray-500 mt-[0.2vw]">
            Insights and performance metrics across all projects and teams
          </p>
        </div>
        <div className="flex items-center gap-[0.5vw]">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="pl-[2vw] pr-[0.8vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <Calendar className="absolute left-[0.6vw] top-1/2 transform -translate-y-1/2 text-gray-400" size="1vw" />
          </div>
          <button
            onClick={exportAnalytics}
            className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vw] text-[0.85vw] text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Download size="1vw" />
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100%-5vw)] overflow-y-auto p-[0.8vw]">
        {/* Overview Cards */}
        <div className="mb-[1vw]">
          <div 
            className="flex items-center justify-between mb-[0.5vw] cursor-pointer"
            onClick={() => toggleSection('overview')}
          >
            <h2 className="text-[1vw] font-semibold text-gray-800 flex items-center gap-[0.3vw]">
              <BarChart3 size="1vw" />
              Overview
            </h2>
            {expandedSections.overview ? <ChevronUp size="1vw" /> : <ChevronDown size="1vw" />}
          </div>
          
          {expandedSections.overview && (
            <div className="grid grid-cols-4 gap-[0.8vw]">
              {/* Total Projects */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-[0.8vw]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.8vw] text-blue-600 font-medium">Total Projects</p>
                    <p className="text-[1.5vw] font-bold text-blue-800 mt-[0.2vw]">{stats.totalProjects}</p>
                  </div>
                  <div className="bg-blue-100 p-[0.5vw] rounded-lg">
                    <BarChart3 size="1.2vw" className="text-blue-600" />
                  </div>
                </div>
                <div className="mt-[0.5vw] flex items-center text-[0.75vw] text-blue-600">
                  <TrendingUp size="0.8vw" className="mr-[0.2vw]" />
                  <span>{stats.activeProjects} active</span>
                </div>
              </div>

              {/* Total Tasks */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-[0.8vw]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.8vw] text-green-600 font-medium">Total Tasks</p>
                    <p className="text-[1.5vw] font-bold text-green-800 mt-[0.2vw]">{stats.totalTasks}</p>
                  </div>
                  <div className="bg-green-100 p-[0.5vw] rounded-lg">
                    <CheckCircle size="1.2vw" className="text-green-600" />
                  </div>
                </div>
                <div className="mt-[0.5vw] flex items-center text-[0.75vw] text-green-600">
                  <span className="mr-[0.5vw]">{stats.completedTasks} completed</span>
                  <span>{stats.inProgressTasks} in progress</span>
                </div>
              </div>

              {/* Team Performance */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-[0.8vw]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.8vw] text-purple-600 font-medium">Team Members</p>
                    <p className="text-[1.5vw] font-bold text-purple-800 mt-[0.2vw]">{stats.totalEmployees}</p>
                  </div>
                  <div className="bg-purple-100 p-[0.5vw] rounded-lg">
                    <Users size="1.2vw" className="text-purple-600" />
                  </div>
                </div>
                <div className="mt-[0.5vw] text-[0.75vw] text-purple-600">
                  <span>Avg. Completion: {stats.avgCompletionRate}%</span>
                </div>
              </div>

              {/* Overdue Tasks */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-[0.8vw]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.8vw] text-red-600 font-medium">Overdue Tasks</p>
                    <p className="text-[1.5vw] font-bold text-red-800 mt-[0.2vw]">{stats.overdueTasks}</p>
                  </div>
                  <div className="bg-red-100 p-[0.5vw] rounded-lg">
                    <AlertCircle size="1.2vw" className="text-red-600" />
                  </div>
                </div>
                <div className="mt-[0.5vw] flex items-center text-[0.75vw] text-red-600">
                  <Clock size="0.8vw" className="mr-[0.2vw]" />
                  <span>Requires attention</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-[0.8vw] mb-[1vw]">
          {/* Project Trends */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-[0.8vw]">
            <div 
              className="flex items-center justify-between mb-[0.5vw] cursor-pointer"
              onClick={() => toggleSection('trends')}
            >
              <h3 className="text-[0.9vw] font-semibold text-gray-800">Project Trends</h3>
              {expandedSections.trends ? <ChevronUp size="0.9vw" /> : <ChevronDown size="0.9vw" />}
            </div>
            
            {expandedSections.trends && (
              <div className="h-[12vw]">
                {projectTrends.length > 0 ? (
                  <div className="space-y-[0.5vw]">
                    {projectTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-[0.8vw] text-gray-600">{trend.month}</span>
                        <div className="flex items-center gap-[0.5vw]">
                          <div className="w-[8vw] bg-gray-200 rounded-full h-[0.6vw]">
                            <div
                              className="bg-blue-600 h-[0.6vw] rounded-full"
                              style={{ width: `${trend.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-[0.8vw] font-medium text-gray-700">{trend.completionRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No trend data available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Department Performance */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-[0.8vw]">
            <div 
              className="flex items-center justify-between mb-[0.5vw] cursor-pointer"
              onClick={() => toggleSection('performance')}
            >
              <h3 className="text-[0.9vw] font-semibold text-gray-800">Department Performance</h3>
              {expandedSections.performance ? <ChevronUp size="0.9vw" /> : <ChevronDown size="0.9vw" />}
            </div>
            
            {expandedSections.performance && (
              <div className="h-[12vw]">
                {departmentPerformance.length > 0 ? (
                  <div className="space-y-[0.5vw]">
                    {departmentPerformance.map((dept, index) => (
                      <div key={index} className="space-y-[0.2vw]">
                        <div className="flex justify-between items-center">
                          <span className="text-[0.8vw] font-medium text-gray-700">{dept.department}</span>
                          <span className="text-[0.8vw] text-gray-600">{dept.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-[0.4vw]">
                          <div
                            className={`h-[0.4vw] rounded-full ${
                              dept.completionRate >= 80 ? 'bg-green-500' :
                              dept.completionRate >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${dept.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No department data available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Distribution & Top Performers */}
        <div className="grid grid-cols-2 gap-[0.8vw] mb-[1vw]">
          {/* Task Distribution */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-[0.8vw]">
            <div 
              className="flex items-center justify-between mb-[0.5vw] cursor-pointer"
              onClick={() => toggleSection('distribution')}
            >
              <h3 className="text-[0.9vw] font-semibold text-gray-800">Task Distribution</h3>
              {expandedSections.distribution ? <ChevronUp size="0.9vw" /> : <ChevronDown size="0.9vw" />}
            </div>
            
            {expandedSections.distribution && (
              <div className="h-[12vw]">
                {taskDistribution.length > 0 ? (
                  <div className="space-y-[0.5vw]">
                    {taskDistribution.map((task, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-[0.3vw]">
                          <div
                            className="w-[0.6vw] h-[0.6vw] rounded-full"
                            style={{ backgroundColor: task.color }}
                          ></div>
                          <span className="text-[0.8vw] text-gray-600">{task.status}</span>
                        </div>
                        <div className="flex items-center gap-[0.5vw]">
                          <span className="text-[0.8vw] font-medium text-gray-700">{task.count}</span>
                          <span className="text-[0.7vw] text-gray-500">({task.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No task distribution data
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top Performers */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-[0.8vw]">
            <div className="flex items-center justify-between mb-[0.5vw]">
              <h3 className="text-[0.9vw] font-semibold text-gray-800">Top Performers</h3>
              <span className="text-[0.75vw] text-gray-500 px-[0.4vw] py-[0.1vw] bg-gray-200 rounded-full">
                This {timeRange}
              </span>
            </div>
            
            <div className="space-y-[0.5vw]">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-[0.5vw] hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="flex items-center gap-[0.5vw]">
                      <div className={`w-[1.5vw] h-[1.5vw] rounded-full flex items-center justify-center text-white text-[0.8vw] font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-700' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-[0.85vw] font-medium text-gray-800">{performer.name}</div>
                        <div className="text-[0.7vw] text-gray-500">{performer.department}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[0.85vw] font-bold text-gray-800">{performer.completedTasks} tasks</div>
                      <div className="text-[0.7vw] text-green-600">{performer.completionRate}% completion</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[8vw] text-gray-400">
                  No performance data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-[0.8vw]">
          <div 
            className="flex items-center justify-between mb-[0.5vw] cursor-pointer"
            onClick={() => toggleSection('recent')}
          >
            <h3 className="text-[0.9vw] font-semibold text-gray-800">Recent Activities</h3>
            {expandedSections.recent ? <ChevronUp size="0.9vw" /> : <ChevronDown size="0.9vw" />}
          </div>
          
          {expandedSections.recent && (
            <div className="space-y-[0.5vw]">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-[0.5vw] p-[0.5vw] hover:bg-gray-100 rounded-lg transition-colors">
                    <div className={`p-[0.4vw] rounded-lg ${
                      activity.type === 'task_completed' ? 'bg-green-100 text-green-600' :
                      activity.type === 'task_created' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'project_created' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'task_completed' ? <CheckCircle size="0.9vw" /> :
                       activity.type === 'task_created' ? <BarChart3 size="0.9vw" /> :
                       <Users size="0.9vw" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-[0.85vw] text-gray-800">{activity.description}</div>
                      <div className="text-[0.7vw] text-gray-500">{activity.timestamp}</div>
                    </div>
                    <div className={`text-[0.75vw] px-[0.4vw] py-[0.1vw] rounded-full ${
                      activity.type === 'task_completed' ? 'bg-green-100 text-green-700' :
                      activity.type === 'task_created' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {activity.type.replace('_', ' ')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[5vw] text-gray-400">
                  No recent activities
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;