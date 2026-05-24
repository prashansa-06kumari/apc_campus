

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
  cgpa?: number;
  rollNumber?: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  academicYear?: string;
  semester?: string;
  sgpaSem1?: number;
  sgpaSem2?: number;
  sgpaSem3?: number;
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
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
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

interface Test {
  id: number;
  title: string;
  description: string;
  subject: string;
  maxMarks: number;
  testDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  instructions: string;
  createdBy: string;
  semester: string;
  academicYear: string;
  status: string;
  isActive: boolean;
}

interface TestSubmission {
  id: number;
  testId: number;
  studentId: number;
  submissionText: string;
  submittedAt: string;
  marksObtained: number;
  feedback: string;
  gradedBy: string;
  gradedAt: string;
  status: string;
}

interface TestResult {
  testId: number;
  testTitle: string;
  subject: string;
  maxMarks: number;
  marksObtained: number;
  feedback: string;
  gradedBy: string;
  gradedAt: string;
  percentage: number;
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
  const [tests, setTests] = useState<Test[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testSubmission, setTestSubmission] = useState<TestSubmission | null>(null);
  const [myFeedback, setMyFeedback] = useState<any[]>([]);


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

const fetchTests = async () => {
  try {
    const res = await api.get('/student/tests');
    setTests(res.data || []);
  } catch (err) {
    console.error('Error fetching tests:', err);
  }
};

const fetchTestResults = async () => {
  try {
    const res = await api.get('/student/test-results');
    setTestResults(res.data || []);
  } catch (err) {
    console.error('Error fetching test results:', err);
  }
};

const fetchTestSubmission = async (testId: number) => {
  try {
    const res = await api.get(`/student/tests/${testId}/submission`);
    setTestSubmission(res.data.submission);
  } catch (err) {
    console.error('Error fetching test submission:', err);
  }
};

const handleSubmitTest = async (testId: number, submissionText: string) => {
  try {
    await api.post(`/student/tests/${testId}/submit`, {
      submissionText
    });
    alert('Test submitted successfully!');
    fetchTestSubmission(testId);
    fetchTests();
  } catch (err) {
    alert('Failed to submit test');
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
    setError(null);

    const results = await Promise.allSettled([
      api.get('/student/profile'),
      api.get('/student/timetable/today'),
      api.get('/student/attendance'),
      api.get('/student/tests'),
      api.get('/student/test-results'),
      api.get('/student/marks'),
      api.get('/student/notifications'),
    ]);

    const getData = (index: number) =>
      results[index].status === 'fulfilled' ? results[index].value.data : null;

    const profileData = getData(0);
    const marksData = getData(5);

    if (profileData) {
      if (marksData?.cgpa !== undefined) {
        profileData.cgpa = marksData.cgpa;
      }
      setProfile(profileData);
    }

    const timetableData = getData(1);
    setTimetable(Array.isArray(timetableData?.timetable) ? timetableData.timetable : []);

    const attendanceData = getData(2);
    setAttendance(Array.isArray(attendanceData) ? attendanceData : []);

    const testsData = getData(3);
    setTests(Array.isArray(testsData) ? testsData : []);

    const testResultsData = getData(4);
    setTestResults(Array.isArray(testResultsData) ? testResultsData : []);

    setMarks(Array.isArray(marksData?.marks) ? marksData.marks : []);

    const notificationsData = getData(6);
    setNotifications(Array.isArray(notificationsData) ? notificationsData : []);

    const allFailed = results.every((result) => result.status === 'rejected');
    if (allFailed) {
      setError('Could not load dashboard data. Check that the API is running on Render.');
    }
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
      await api.post(`/student/fees/${feeId}/pay`);
      alert('Fees submitted successfully!');
      fetchDashboardData();
    } catch (err) {
      alert('Payment failed');
    }
  };



  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
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
        <button
          className={activeTab === 'tests' ? 'active' : ''}
          onClick={() => setActiveTab('tests')}
        >
          Tests
        </button>
        <button
          className={activeTab === 'test-results' ? 'active' : ''}
          onClick={() => setActiveTab('test-results')}
        >
          Test Results
        </button>
        <button
          className={activeTab === 'feedback' ? 'active' : ''}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback
        </button>
        <button
          className={activeTab === 'my-feedback' ? 'active' : ''}
          onClick={() => setActiveTab('my-feedback')}
        >
          My Feedback
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
                <div className="stat-value">₹{fees.filter(fee => fee.status === 'PENDING').reduce((sum, fee) => sum + fee.amount, 0)}</div>
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
                    <span>Amount: ₹{fee.amount}</span>
                    <span>Due Date: {new Date(fee.dueDate).toLocaleDateString()}</span>
                    {fee.paidDate && <span>Paid Date: {new Date(fee.paidDate).toLocaleDateString()}</span>}
                    {fee.transactionId && <span>Transaction ID: {fee.transactionId}</span>}
                  </div>
                  <div className="fee-status">
                    <span className={`status ${fee.status.toLowerCase()}`}>{fee.status}</span>
                  </div>
                  {fee.status === 'PENDING' && (
                    <button
                      className="pay-btn"
                      onClick={() => handleFeePayment(fee.id)}
                    >
                      Pay Fees
                    </button>
                  )}
                  {fee.status === 'PAID' && (
                    <div className="payment-success">
                      ✓ Fees submitted successfully
                    </div>
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

        {activeTab === 'tests' && (
          <div className="tests-tab">
            <div className="tests-header">
              <h2>Available Tests</h2>
            </div>
            <div className="tests-list">
              {tests.map((test) => (
                <div key={test.id} className="test-item">
                  <div className="test-header">
                    <h3>{test.title}</h3>
                    <span className="test-subject">{test.subject}</span>
                  </div>
                  <div className="test-details">
                    <p>{test.description}</p>
                    <div className="test-meta">
                      <span>Date: {new Date(test.testDate).toLocaleDateString()}</span>
                      <span>Time: {test.startTime} - {test.endTime}</span>
                      <span>Max Marks: {test.maxMarks}</span>
                      <span>Duration: {test.durationMinutes} minutes</span>
                    </div>
                    {test.instructions && (
                      <div className="test-instructions">
                        <h4>Instructions:</h4>
                        <p>{test.instructions}</p>
                      </div>
                    )}
                  </div>
                  <div className="test-actions">
                    <button 
                      onClick={() => {
                        setSelectedTest(test);
                        fetchTestSubmission(test.id);
                      }}
                      className="view-test-btn"
                    >
                      {testSubmission ? 'View Submission' : 'Take Test'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedTest && (
              <div className="test-submission-section">
                <h3>Test: {selectedTest.title}</h3>
                {testSubmission ? (
                  <div className="submission-status">
                    <h4>Submission Status: {testSubmission.status}</h4>
                    <p><strong>Submitted at:</strong> {new Date(testSubmission.submittedAt).toLocaleString()}</p>
                    <p><strong>Your submission:</strong></p>
                    <div className="submission-text">{testSubmission.submissionText}</div>
                    {testSubmission.status === 'GRADED' && (
                      <div className="graded-info">
                        <h4>Results:</h4>
                        <p><strong>Marks:</strong> {testSubmission.marksObtained}/{selectedTest.maxMarks}</p>
                        <p><strong>Percentage:</strong> {Math.round((testSubmission.marksObtained / selectedTest.maxMarks) * 100)}%</p>
                        <p><strong>Feedback:</strong> {testSubmission.feedback}</p>
                        <p><strong>Graded by:</strong> {testSubmission.gradedBy}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="test-submission-form">
                    <h4>Submit Your Test</h4>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const submissionText = formData.get('submissionText') as string;
                      if (submissionText.trim()) {
                        handleSubmitTest(selectedTest.id, submissionText);
                      }
                    }}>
                      <div className="form-group">
                        <label>Your Answer:</label>
                        <textarea
                          name="submissionText"
                          rows={10}
                          placeholder="Enter your test submission here..."
                          required
                        />
                      </div>
                      <button type="submit" className="submit-test-btn">Submit Test</button>
                    </form>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setSelectedTest(null);
                    setTestSubmission(null);
                  }}
                  className="close-btn"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'test-results' && (
          <div className="test-results-tab">
            <div className="test-results-header">
              <h2>Test Results</h2>
            </div>
            <div className="test-results-list">
              {testResults.length === 0 ? (
                <p>No test results available yet.</p>
              ) : (
                testResults.map((result) => (
                  <div key={result.testId} className="test-result-item">
                    <div className="result-header">
                      <h3>{result.testTitle}</h3>
                      <span className="result-subject">{result.subject}</span>
                    </div>
                    <div className="result-details">
                      <div className="result-marks">
                        <span className="marks-obtained">{result.marksObtained}</span>
                        <span className="marks-separator">/</span>
                        <span className="marks-total">{result.maxMarks}</span>
                        <span className="result-percentage">({result.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="result-feedback">
                        <h4>Feedback:</h4>
                        <p>{result.feedback}</p>
                      </div>
                      <div className="result-meta">
                        <span>Graded by: {result.gradedBy}</span>
                        <span>Graded at: {new Date(result.gradedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-tab">
            <div className="feedback-header">
              <h2>Submit Feedback</h2>
              <p>Share your thoughts, suggestions, or report any issues</p>
            </div>
            <FeedbackForm />
          </div>
        )}

        {activeTab === 'my-feedback' && (
          <div className="my-feedback-tab">
            <div className="my-feedback-header">
              <h2>My Feedback</h2>
              <p>View your submitted feedback and admin responses</p>
            </div>
            <MyFeedbackList />
          </div>
        )}

      </div>
    </div>
  );
};

function FeedbackForm() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'GENERAL'
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const categories = [
    { value: 'GENERAL', label: 'General' },
    { value: 'ACADEMIC', label: 'Academic' },
    { value: 'FACILITY', label: 'Facility' },
    { value: 'TECHNICAL', label: 'Technical' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setMessage('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      await api.post('/student/feedback', formData);
      setMessage('Feedback submitted successfully!');
      setFormData({ title: '', message: '', category: 'GENERAL' });
    } catch (err) {
      setMessage('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="feedback-form-container">
      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief description of your feedback"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Please provide detailed feedback..."
            rows={6}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="submit-btn"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

function MyFeedbackList() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyFeedback();
  }, []);

  const fetchMyFeedback = async () => {
    try {
      const res = await api.get('/student/my-feedback');
      setFeedback(res.data);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading your feedback...</div>;

  return (
    <div className="my-feedback-list">
      {feedback.length === 0 ? (
        <p>You haven't submitted any feedback yet.</p>
      ) : (
        feedback.map((item) => (
          <div key={item.id} className="feedback-item">
            <div className="feedback-header">
              <h3>{item.title}</h3>
              <span className={`feedback-status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
            <div className="feedback-category">{item.category}</div>
            <p className="feedback-message">{item.message}</p>
            <div className="feedback-date">
              Submitted: {new Date(item.createdAt).toLocaleDateString()}
            </div>
            
            {item.adminResponse && (
              <div className="admin-response">
                <h4>Admin Response:</h4>
                <p>{item.adminResponse}</p>
                <small>
                  By: {item.respondedBy} on {new Date(item.respondedAt).toLocaleDateString()}
                </small>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default StudentDashboard;
