import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [dateRange, setDateRange] = useState('30');

  const quotes = [
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
  ];

  const employees = [
    { id: 1, name: "Sarah Johnson", role: "Sales Manager", avatar: "SJ", birthday: "2026-01-25" },
    { id: 2, name: "Michael Chen", role: "Developer", avatar: "MC", birthday: "2026-02-10" },
    { id: 3, name: "Emma Davis", role: "Marketing Lead", avatar: "ED", birthday: "2026-01-22" },
    { id: 4, name: "James Wilson", role: "Product Manager", avatar: "JW", birthday: "2026-03-15" }
  ];

  const employeeGrowthData = [
    { month: 'Jan', employees: 18 },
    { month: 'Feb', employees: 19 },
    { month: 'Mar', employees: 20 },
    { month: 'Apr', employees: 22 },
    { month: 'May', employees: 23 },
    { month: 'Jun', employees: 24 }
  ];

  const projectsByDepartment = [
    { name: 'Sales', value: 5 },
    { name: 'Marketing', value: 4 },
    { name: 'Development', value: 6 },
    { name: 'Design', value: 3 }
  ];

  const weeklyTasksData = [
    { day: 'Mon', tasks: 12 },
    { day: 'Tue', tasks: 19 },
    { day: 'Wed', tasks: 15 },
    { day: 'Thu', tasks: 22 },
    { day: 'Fri', tasks: 18 },
    { day: 'Sat', tasks: 8 },
    { day: 'Sun', tasks: 5 }
  ];

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  const refreshQuote = () => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  };

  const getBirthdaysThisMonth = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    
    return employees.filter(emp => {
      const birthday = new Date(emp.birthday);
      return birthday.getMonth() === currentMonth;
    }).sort((a, b) => new Date(a.birthday) - new Date(b.birthday));
  };

  const upcomingBirthdays = getBirthdaysThisMonth();

  const formatBirthday = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0', margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <main>
          {/* Quote Section */}
          {currentQuote && (
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
              <button 
                onClick={refreshQuote}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
                title="New Quote"
              >
                <RefreshCw style={{ width: '18px', height: '18px', color: '#666' }} />
              </button>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>Daily Motivation</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#555', fontStyle: 'italic' }}>"{currentQuote.text}"</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>— {currentQuote.author}</p>
            </div>
          )}

          {/* KPI Cards */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Employees</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#333' }}>24</p>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Projects</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#333' }}>18</p>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Active Deals</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#333' }}>42</p>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Revenue</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#333' }}>$125K</p>
            </div>
          </section>

          {/* Charts Section */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>Employee Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={employeeGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="employees" stroke="rgb(75, 192, 192)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>Projects by Department</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectsByDepartment}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectsByDepartment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>Weekly Tasks</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyTasksData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="rgba(75, 192, 192, 0.6)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>Upcoming Birthdays</h3>
              {upcomingBirthdays.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {upcomingBirthdays.map(employee => (
                    <div key={employee.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                        {employee.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333', fontSize: '15px' }}>{employee.name}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{employee.role}</p>
                      </div>
                      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '20px', padding: '6px 12px', fontSize: '13px', color: '#667eea', fontWeight: '500' }}>
                        🎂 {formatBirthday(employee.birthday)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <Calendar style={{ width: '48px', height: '48px', margin: '0 auto 15px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No birthdays this month</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;