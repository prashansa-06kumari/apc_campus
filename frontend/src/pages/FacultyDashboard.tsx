import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import api from '../utils/api';
import './Dashboard.css';

interface FacultyProfile {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  email: string;
  phone: string;
  address: string;
  designation: string;
  qualification: string;
  experience: string;
  coursesTaught: string;
}

interface TimetableEntry {
  id: number;
  subject: string;
  teacher: string;
  classroom: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}



interface AttendanceRecord {
  id: number;
  studentId: number;
  subject: string;
  date: string;
  status: string;
  markedBy: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  createdBy: string;
}


const FacultyDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<{ studentId: number; name: string }[]>([]);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [notifications, setNotifications] = useState([]);

// Add this at the top, with other useState hooks
const [newNotification, setNewNotification] = useState({
  title: '',
  message: '',
  targetRole: 'STUDENT'
});


  const [timetable, setTimetable] = useState<TimetableEntry[] | null>(null);

   const [assignments, setAssignments] = useState([
     {
       id: 1,
       title: 'OS Midterm',
       description: 'Write answers to Unit 1 and 2 questions.',
       subject: 'Operating Systems',
       dueDate: '2025-09-25T23:59',
       maxMarks: 50
     },
     {
       id: 2,
       title: 'CN Quiz',
       description: 'Multiple choice quiz on TCP/IP.',
       subject: 'Computer Networks',
       dueDate: '2025-09-28T23:59',
       maxMarks: 20
     }
   ]);



  useEffect(() => {
    fetchDashboardData();
  }, []);



  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ studentsRes, notificationsRes] = await Promise.all([

        api.get('/faculty/students'),
        api.get('/faculty/notifications')
      ]);


      setStudents(studentsRes.data || []);
      setNotifications(notificationsRes.data || []);

    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/faculty/assignments', {
        ...newAssignment,
        maxMarks: parseInt(newAssignment.maxMarks),
        dueDate: new Date(newAssignment.dueDate).toISOString()
      });
      alert('Assignment created successfully!');
      setNewAssignment({ title: '', description: '', subject: '', maxMarks: '', dueDate: '' });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to create assignment');
    }
  };

 const handleCreateNotification = async (e: React.FormEvent) => {
   e.preventDefault();
   try {
     await api.post('/faculty/notifications', newNotification);
     alert('Notification created successfully!');
     setNewNotification({ title: '', message: '', targetRole: 'STUDENT' });
     fetchDashboardData();
   } catch (err) {
     alert('Failed to create notification');
   }
 };

const handleEditNotification = async (notification: Notification) => {
  const newTitle = prompt("Enter new title", notification.title);
  const newMessage = prompt("Enter new message", notification.message);
  if (!newTitle || !newMessage) return;

  try {
    await api.put(`/faculty/notifications/${notification.id}`, {
      ...notification,
      title: newTitle,
      message: newMessage
    });
    alert("Notification updated successfully");
    fetchDashboardData();
  } catch (err) {
    alert("Failed to update notification");
  }
};

const handleDeleteNotification = async (id: number) => {
  if (!window.confirm("Are you sure you want to delete this notification?")) return;

  try {
    await api.delete(`/faculty/notifications/${id}`);
    alert("Notification deleted successfully");
    fetchDashboardData();
  } catch (err) {
    alert("Failed to delete notification");
  }
};



   const [markedStudents, setMarkedStudents] = useState<number[]>([]);

   const handleMarkAttendance = async (studentId: number, status: string) => {
     try {
       const today = new Date().toISOString().split('T')[0];
       await api.post('/faculty/attendance/mark', { studentId, date: today, status });

       // ✅ Add to marked students to disable buttons
       setMarkedStudents(prev => [...prev, studentId]);
       alert(`Marked ${status} for student ${studentId}`);
     } catch (err) {
       alert('Failed to mark attendance');
       console.error(err);
     }
   };




  const handleGradeAssignment = async (submissionId: number, marks: number, feedback: string) => {
    try {
      await api.post('/faculty/assignments/1/grade', {
        submissionId,
        marks,
        feedback
      });
      alert('Assignment graded successfully!');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to grade assignment');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Faculty Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {profile?.name ? `Dr. ${profile.name}` : user?.username}</span>

          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'schedule' ? 'active' : ''} 
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
        <button 
          className={activeTab === 'assignments' ? 'active' : ''} 
          onClick={() => setActiveTab('assignments')}
        >
          Assignments
        </button>
        <button 
          className={activeTab === 'attendance' ? 'active' : ''} 
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
        <button 
          className={activeTab === 'marks' ? 'active' : ''} 
          onClick={() => setActiveTab('marks')}
        >
          Marks
        </button>
        <button 
          className={activeTab === 'notifications' ? 'active' : ''} 
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
      </div>
<div className="dashboard-content">
  {activeTab === 'overview' && (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="stat-card">
          <h3>Today's Classes</h3>
          <div className="stat-value">{timetable ? timetable.length : 0}</div>
        </div>
        <div className="stat-card">
          <h3>Active Assignments</h3>
          <div className="stat-value">{assignments.length}</div>
        </div>


        <div className="stat-card">
          <h3>Students Taught</h3>
          <div className="stat-value">45</div>
        </div>
      </div>

      <div className="overview-sections">
        <div className="overview-section">
          <h3>Today's Schedule</h3>


        </div>
       <div className="overview-section">
         <h3>Recent Notifications</h3>
         <div className="notifications-list">
           {notifications
             .slice(0, 3) // latest 3 notifications
             .map((notification: Notification) => (
               <div key={notification.id} className="notification-item">
                 <div className="notification-title">{notification.title}</div>
                 <div className="notification-message">{notification.message}</div>
                 <div className="notification-date">
                   {new Date(notification.createdAt).toLocaleDateString()} by {notification.createdBy}
                 </div>
               </div>
             ))}
         </div>
       </div>




      </div>
    </div>
  )}

  {activeTab === 'schedule' && (
    <div className="schedule-tab">
      <div className="schedule-header">
        <h2>Today's Schedule</h2>
        <div className="schedule-summary">
          <span>{timetable ? timetable.length : 0} classes, {timetable ? timetable.length : 0} hours total</span>
        </div>
      </div>
      <div className="schedule-list">
        {timetable && timetable.map((classItem) => (
          <div key={classItem.id} className="schedule-item">
            <div className="class-time">
              <div className="time-range">{classItem.startTime} - {classItem.endTime}</div>
            </div>
            <div className="class-info">
              <div className="class-subject">{classItem.subject}</div>
              <div className="class-room">Room: {classItem.classroom}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>

        {activeTab === 'assignments' && (
          <div className="assignments-tab">
            <div className="assignments-header">
              <h2>Assignment Management</h2>
            </div>

            <div className="assignment-forms">
              <div className="form-section">
                <h3>Create New Assignment</h3>
                <form onSubmit={handleCreateAssignment} className="assignment-form">
                  <div className="form-group">
                    <label>Title:</label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject:</label>
                    <select
                      value={newAssignment.subject}
                      onChange={(e) => setNewAssignment({...newAssignment, subject: e.target.value})}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.subjectName}>
                          {subject.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Max Marks:</label>
                    <input
                      type="number"
                      value={newAssignment.maxMarks}
                      onChange={(e) => setNewAssignment({...newAssignment, maxMarks: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Due Date:</label>
                    <input
                      type="datetime-local"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">Create Assignment</button>
                </form>
              </div>
            </div>

            <div className="assignments-list">
              <h3>Existing Assignments</h3>
              {assignments.map((assignment) => (
                <div key={assignment.id} className="assignment-item">
                  <div className="assignment-header">
                    <h4>{assignment.title}</h4>
                    <span className="assignment-subject">{assignment.subject}</span>
                  </div>
                  <div className="assignment-details">
                    <p>{assignment.description}</p>
                    <div className="assignment-meta">
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span>Max Marks: {assignment.maxMarks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

       {activeTab === 'attendance' && (
         <div className="attendance-tab">
           <div className="attendance-header">
             <h2>Attendance Management</h2>
           </div>
           <div className="attendance-list">
             {students.map((student) => (
               <div key={student.studentId} className="attendance-item">
                 <div className="attendance-student">
                   Student: {student.name} (ID: {student.studentId})
                 </div>
                 <div className="attendance-actions">
                   <button
                     className="present-btn"
                     disabled={markedStudents.includes(student.studentId)}
                     onClick={() => handleMarkAttendance(student.studentId, 'PRESENT')}
                   >
                     Present
                   </button>
                   <button
                     className="absent-btn"
                     disabled={markedStudents.includes(student.studentId)}
                     onClick={() => handleMarkAttendance(student.studentId, 'ABSENT')}
                   >
                     Absent
                   </button>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}



        {activeTab === 'marks' && (
          <div className="marks-tab">
            <div className="marks-header">
              <h2>Marks Management</h2>
            </div>
            
            <div className="marks-forms">
              <div className="form-section">
                <h3>Add New Mark</h3>
                <form onSubmit={handleAddMark} className="marks-form">
                  <div className="form-group">
                    <label>Student ID:</label>
                    <input
                      type="number"
                      value={newMark.studentId}
                      onChange={(e) => setNewMark({...newMark, studentId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject:</label>
                    <select
                      value={newMark.subject}
                      onChange={(e) => setNewMark({...newMark, subject: e.target.value})}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.subjectName}>
                          {subject.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Exam Type:</label>
                    <select
                      value={newMark.examType}
                      onChange={(e) => setNewMark({...newMark, examType: e.target.value})}
                      required
                    >
                      <option value="MIDTERM">Midterm</option>
                      <option value="FINAL">Final</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="ASSIGNMENT">Assignment</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marks Obtained:</label>
                    <input
                      type="number"
                      value={newMark.marksObtained}
                      onChange={(e) => setNewMark({...newMark, marksObtained: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Marks:</label>
                    <input
                      type="number"
                      value={newMark.maxMarks}
                      onChange={(e) => setNewMark({...newMark, maxMarks: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Semester:</label>
                    <input
                      type="text"
                      value={newMark.semester}
                      onChange={(e) => setNewMark({...newMark, semester: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Academic Year:</label>
                    <input
                      type="text"
                      value={newMark.academicYear}
                      onChange={(e) => setNewMark({...newMark, academicYear: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">Add Mark</button>
                </form>
              </div>
            </div>

            <div className="marks-list">
              <h3>Existing Marks</h3>
              {marks.map((mark) => (
                <div key={mark.id} className="mark-item">
                  <div className="mark-student">Student ID: {mark.studentId}</div>
                  <div className="mark-subject">{mark.subject}</div>
                  <div className="mark-exam-type">{mark.examType}</div>
                  <div className="mark-score">
                    {mark.marksObtained}/{mark.maxMarks}
                  </div>
                  <div className="mark-percentage">
                    {Math.round((mark.marksObtained / mark.maxMarks) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-tab">
            <div className="notifications-header">
              <h2>Notification Management</h2>
            </div>
            
            <div className="notification-forms">
              <div className="form-section">
                <h3>Create New Notification</h3>
                <form onSubmit={handleCreateNotification} className="notification-form">
                  <div className="form-group">
                    <label>Title:</label>
                    <input
                      type="text"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                      required
                    />
                    <textarea
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                      required
                    />
                    <select
                      value={newNotification.targetRole}
                      onChange={(e) => setNewNotification({...newNotification, targetRole: e.target.value})}
                      required
                    >
                      <option value="STUDENT">Student</option>
                    </select>


                  </div>
                  <button type="submit" className="submit-btn">Create Notification</button>
                </form>
              </div>
            </div>

            <div className="notifications-list">
              <h3>Existing Notifications</h3>
              {notifications.map((notification: Notification) => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-meta">

                    <span>Date: {new Date(notification.createdAt).toLocaleDateString()}</span>
                  </div>
                  {user?.username && notification.createdBy === user.username && (
                    <div className="notification-actions">
                      <button onClick={() => handleEditNotification(notification)}>Edit</button>
                      <button onClick={() => handleDeleteNotification(notification.id)}>Delete</button>
                    </div>
                  )}


                </div>
              ))}

            </div>
          </div>
        )}


    </div>
  );
};

export default FacultyDashboard;