import React, { useState } from "react";
// Correcting paths: pages/ -> ../components/TeacherPanel/ is now ../components/TeacherPanel/
import TeacherHeader from "../components/TeacherPanel/TeacherHeader";
// 🛑 IMPORT UPDATES: Importing ManageClasses, PastClasses, and ScheduledClasses 🛑
import ManageClasses from "../components/TeacherPanel/ManageClasses";
import PastClasses from "../components/TeacherPanel/PastClasses";
import ScheduledClasses from "../components/TeacherPanel/ScheduledClasses"; // New Import
import { Clock, ListChecks, Calendar } from "lucide-react"; // Using lucide-react for icons

const TeacherDashboard = () => {
  // State to manage the active tab: 'current', 'past', or 'schedule'
  const [activeTab, setActiveTab] = useState('current'); 

  // Helper component for sidebar links
  const NavLink = ({ tab, icon: Icon, label }) => (
    <div
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 rounded-lg 
        ${activeTab === tab 
          ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
        }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </div>
  );

  // Function to determine the component to render based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'current':
        return <ManageClasses />; 
      case 'past':
        return <PastClasses />; 
      case 'schedule': // 🛑 New case for Scheduled Classes 🛑
        return <ScheduledClasses />;
      default:
        return <ManageClasses />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Top Header */}
      <TeacherHeader />
      
      {/* 2. Main Content Area: Sidebar + Dashboard Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-xl p-4 border-r border-gray-100 hidden sm:block flex-shrink-0">
          <nav className="space-y-2 pt-4">
            
            {/* Manage Classes Tab (Current/Upcoming) */}
            <NavLink 
              tab="current" 
              icon={ListChecks} 
              label="Manage Classes"
            />
            
            {/* Scheduled Classes Tab */}
            <NavLink 
              tab="schedule" 
              icon={Calendar} // Icon for schedule
              label="Scheduled Classes"
            />

            {/* Past Classes Tab */}
            <NavLink 
              tab="past" 
              icon={Clock} 
              label="Past Classes"
            />
          </nav>
        </aside>

        {/* Dashboard Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {/* Main Card Container - Responsive Padding */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 min-h-full">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-4 sm:mb-6 border-b pb-3">
              {activeTab === 'current' ? 'Current & Upcoming Classes' : activeTab === 'past' ? 'Your Past Classes' : 'Weekly Schedule Overview'}
            </h1>
            
            {/* Mobile/Tablet Nav Dropdown (visible only on mobile) */}
            <div className="sm:hidden mb-4">
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-base"
              >
                <option value="current">Manage Classes</option>
                <option value="schedule">Scheduled Classes</option>
                <option value="past">Past Classes</option>
              </select>
            </div>
            
            {/* Render the active component */}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;