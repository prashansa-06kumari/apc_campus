

import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import api from '../utils/api';
import './Dashboard.css';

interface StudentProfile {
  id: number;
  name: string;
  username: string;
  role: string;
  studentId: string;

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

interface Assignment {
  id: number;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  maxMarks: number;
  assignedBy: string;
}

interface AttendanceRecord {
  id: number;
  subject: string;
  date: string;
  status: string;
  markedBy: string;
}

interface Mark {
  id: number;
  subject: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  semester: string;
  academicYear: string;
}

interface Fee {
  id: number;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
}


interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  createdBy: string;
}
interface IssuedBook {
  id: number;
  title: string;
  author: string;
  isbn: string;
  issuedAt: string;
  dueDate: string;
}


const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);


useEffect(() => {
  if (user) {
    api.get('/student/profile')
      .then(res => setProfile(res.data))
      .catch(err => console.error(err));
  }
}, [user]);


useEffect(() => {
  if (profile) fetchLibraryBooks();
}, [profile]);

const fetchLibraryBooks = async () => {
  try {
    const res = await api.get('/student/library/issues');
    setIssuedBooks(res.data);
  } catch (err) {
    console.error('Error fetching issued books:', err);
  }
};


  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
      fetchAttendance();
    }, []);
  const fetchAttendance = async () => {
    try {
      const res = await api.get('/student/attendance');
      setAttendance(res.data);  // should be array of attendance records
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };


  // Call it once on component mount
  useEffect(() => {
    if (profile) fetchLibraryBooks();
  }, [profile]);


const fetchDashboardData = async () => {
  try {
    setLoading(true);

    // Only call the APIs you actually need
    const [profileRes, timetableRes, attendanceRes] = await Promise.all([
      api.get('/student/profile'),
      api.get('/student/timetable/today'),
      api.get('/student/attendance'),
    ]);

    // Use optional chaining to prevent undefined errors
    setProfile(profileRes?.data || null);
    setTimetable(timetableRes?.data?.timetable || []);
    setAttendance(attendanceRes?.data || []);

    // Fetch notifications separately
    const notificationsRes = await api.get('/student/notifications');
    setNotifications(notificationsRes?.data || []);

  } catch (err) {
    setError('Failed to fetch dashboard data');
    console.error('Error fetching dashboard data:', err);
  } finally {
    setLoading(false);
  }
};


  const handleAssignmentSubmission = async (assignmentId: number, submissionText: string) => {
    try {
      await api.post(`/student/assignments/${assignmentId}/submit`, {
        text: submissionText
      });
      alert('Assignment submitted successfully!');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to submit assignment');
    }
  };

  const handleFeePayment = async (feeId: number) => {
    try {
      // Mock payment functionality
      alert('Payment processed successfully! (Mock)');
      fetchDashboardData();
    } catch (err) {
      alert('Payment failed');
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
        <h1>Student Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {profile?.name || user?.username || 'Student'}</span>

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
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'timetable' ? 'active' : ''}
          onClick={() => setActiveTab('timetable')}
        >
          Timetable
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
          className={activeTab === 'fees' ? 'active' : ''}
          onClick={() => setActiveTab('fees')}
        >
          Fees
        </button>

        <button
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={activeTab === 'library' ? 'active' : ''}
          onClick={() => setActiveTab('library')}
        >
          My Books
        </button>

      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="stat-card">
                <h3>CGPA</h3>
                <div className="stat-value">{profile?.cgpa || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Today's Classes</h3>
                <div className="stat-value">{timetable.length}</div>
              </div>
              <div className="stat-card">
                <h3>Pending Assignments</h3>
                <div className="stat-value">{assignments.length}</div>
              </div>
              <div className="stat-card">
                <h3>Total Fees Due</h3>
                <div className="stat-value">₹{fees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0)}</div>
              </div>
            </div>

            <div className="overview-sections">
              <div className="overview-section">
                <h3>Today's Schedule</h3>
                <div className="schedule-list">
                  {timetable.map((classItem) => (
                    <div key={classItem.id} className="schedule-item">
                      <div className="class-time">{classItem.startTime} - {classItem.endTime}</div>
                      <div className="class-details">
                        <div className="class-subject">{classItem.subject}</div>
                        <div className="class-teacher">{classItem.teacher}</div>
                        <div className="class-room">{classItem.classroom}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overview-section">
                <h3>Recent Notifications</h3>
                <div className="notifications-list">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-date">{new Date(notification.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-tab">
            <div className="profile-header">
              <h2>Student Profile</h2>
            </div>
            <div className="profile-content">
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="profile-grid">
                  <div className="profile-field">
                    <label>Name:</label>
                    <span>{profile?.name}</span>
                  </div>
                  <div className="profile-field">
                    <label>Roll Number:</label>
                    <span>{profile?.rollNumber}</span>
                  </div>
                  <div className="profile-field">
                    <label>Department:</label>
                    <span>{profile?.department}</span>
                  </div>
                  <div className="profile-field">
                    <label>Email:</label>
                    <span>{profile?.email}</span>
                  </div>
                  <div className="profile-field">
                    <label>Phone:</label>
                    <span>{profile?.phone}</span>
                  </div>
                  <div className="profile-field">
                    <label>Address:</label>
                    <span>{profile?.address}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Academic Information</h3>
                <div className="profile-grid">
                  <div className="profile-field">
                    <label>Academic Year:</label>
                    <span>{profile?.academicYear}</span>
                  </div>
                  <div className="profile-field">
                    <label>Semester:</label>
                    <span>{profile?.semester}</span>
                  </div>
                  <div className="profile-field">
                    <label>CGPA:</label>
                    <span className="cgpa-value">{profile?.cgpa}</span>
                  </div>
                  <div className="profile-field">
                    <label>SGPA Sem 1:</label>
                    <span>{profile?.sgpaSem1}</span>
                  </div>
                  <div className="profile-field">
                    <label>SGPA Sem 2:</label>
                    <span>{profile?.sgpaSem2}</span>
                  </div>
                  <div className="profile-field">
                    <label>SGPA Sem 3:</label>
                    <span>{profile?.sgpaSem3}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

{activeTab === 'library' && (
  <div className="library-tab">
    <h2>Issued Books</h2>
    {issuedBooks.length === 0 ? (
      <p>No books issued</p>
    ) : (
      <table className="issued-books-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>ISBN</th>
            <th>Issued At</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {issuedBooks.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.isbn}</td>
              <td>{book.issuedAt}</td>
              <td>{book.dueDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}

        {activeTab === 'timetable' && (
          <div className="timetable-tab">
            <div className="timetable-header">
              <h2>Today's Classes</h2>
              <div className="timetable-summary">
                <span>{timetable.length} classes, {timetable.length} hours total</span>
              </div>
            </div>
            <div className="timetable-list">
              {timetable.map((classItem) => (
                <div key={classItem.id} className="timetable-item">
                  <div className="class-time">
                    <div className="time-range">{classItem.startTime} - {classItem.endTime}</div>
                  </div>
                  <div className="class-info">
                    <div className="class-subject">{classItem.subject}</div>
                    <div className="class-teacher">Teacher: {classItem.teacher}</div>
                    <div className="class-room">Room: {classItem.classroom}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="assignments-tab">
            <div className="assignments-header">
              <h2>Pending Assignments</h2>
            </div>
            <div className="assignments-list">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="assignment-item">
                  <div className="assignment-header">
                    <h3>{assignment.title}</h3>
                    <span className="assignment-subject">{assignment.subject}</span>
                  </div>
                  <div className="assignment-details">
                    <p>{assignment.description}</p>
                    <div className="assignment-meta">
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span>Max Marks: {assignment.maxMarks}</span>
                      <span>Assigned by: {assignment.assignedBy}</span>
                    </div>
                  </div>
                  <div className="assignment-actions">
                    <button
                      className="submit-btn"
                      onClick={() => {
                        const submission = prompt('Enter your submission:');
                        if (submission) {
                          handleAssignmentSubmission(assignment.id, submission);
                        }
                      }}
                    >
                      Submit Assignment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="attendance-tab">
            <div className="attendance-header">
              <h2>Attendance Record</h2>
            </div>
            <div className="attendance-summary">
              <div className="attendance-stats">
                <div className="stat-item">
                  <span className="stat-label">Overall Attendance:</span>
                  <span className="stat-value">88%</span>
                </div>
              </div>
            </div>
            <div className="attendance-list">
              {attendance.map((record) => (
                <div key={record.id} className="attendance-item">
                  <div className="attendance-subject">{record.subject}</div>
                  <div className="attendance-date">{new Date(record.date).toLocaleDateString()}</div>
                  <div className={`attendance-status ${record.status.toLowerCase()}`}>
                    {record.status}
                  </div>
                  <div className="attendance-marked-by">Marked by: {record.markedBy}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="marks-tab">
            <div className="marks-header">
              <h2>Marks & Grades</h2>
            </div>
            <div className="marks-list">
              {marks.map((mark) => (
                <div key={mark.id} className="mark-item">
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

        {activeTab === 'fees' && (
          <div className="fees-tab">
            <div className="fees-header">
              <h2>Fee Status</h2>
            </div>
            <div className="fees-list">
              {fees.map((fee) => (
                <div key={fee.id} className="fee-item">
                  <div className="fee-type">{fee.feeType}</div>
                  <div className="fee-amounts">
                    <span>Total: ₹{fee.amount}</span>
                    <span>Paid: ₹{fee.paidAmount}</span>
                    <span>Balance: ₹{fee.amount - fee.paidAmount}</span>
                  </div>
                  <div className="fee-status">
                    <span className={`status ${fee.status.toLowerCase()}`}>{fee.status}</span>
                  </div>
                  {fee.amount > fee.paidAmount && (
                    <button
                      className="pay-btn"
                      onClick={() => handleFeePayment(fee.id)}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

         {activeTab === 'notifications' && (
                  <div className="notifications-tab">
                    <div className="notifications-header">
                      <h2>Notifications</h2>
                    </div>
                    <div className="notifications-list">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="notification-item">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-meta">
                            <span>By: {notification.createdBy}</span>
                            <span>Date: {new Date(notification.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


      </div>
    </div>
  );
};

export default StudentDashboard;
