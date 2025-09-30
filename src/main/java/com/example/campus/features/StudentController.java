


package com.example.campus.features;

import com.example.campus.entity.*;
import com.example.campus.repository.*;
import com.example.campus.security.JwtService;
import com.example.campus.user.User;
import com.example.campus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import com.example.campus.entity.Library;
import com.example.campus.repository.LibraryRepository;


@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Autowired
    private MarkRepository markRepository;

    @Autowired
    private FeeRepository feeRepository;

    @Autowired
    private NotificationRepository notificationRepository;


    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TimetableRepository timetableRepository;

    @Autowired
    private LibraryRepository libraryRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private TestSubmissionRepository testSubmissionRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Long studentId = user.getId();
            LocalDate today = LocalDate.now();

            // Today's attendance
            List<Attendance> todayAttendance = attendanceRepository.findByStudentIdAndDate(studentId, today);

            // Pending assignments
            List<Assignment> pendingAssignments = assignmentRepository.findUpcomingAssignments(LocalDateTime.now());

            // Fee status
            BigDecimal totalPaid = feeRepository.calculateTotalPaid(studentId);
            BigDecimal totalPending = feeRepository.calculateTotalPending(studentId);

            // Recent notifications
            List<Notification> notifications = notificationRepository.findByTargetRoleOrAll(Notification.TargetRole.STUDENT);
            notifications = notifications.stream().limit(5).toList();

            // CGPA calculation
            Double cgpa = markRepository.calculateCGPA(studentId);
            if (cgpa == null) cgpa = 0.0;

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("todayAttendance", todayAttendance);
            dashboard.put("pendingAssignments", pendingAssignments);
            dashboard.put("totalPaid", totalPaid != null ? totalPaid : BigDecimal.ZERO);
            dashboard.put("totalPending", totalPending != null ? totalPending : BigDecimal.ZERO);
            dashboard.put("notifications", notifications);
            dashboard.put("cgpa", Math.round(cgpa * 100.0) / 100.0);
            dashboard.put("studyHours", 3.5); // Mock data
            dashboard.put("schedule", "Maths at 10:00, Physics at 2:00"); // Mock data

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/library/issues")
    public ResponseEntity<?> getIssuedBooks(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            // Fetch books issued to this student
            List<Library> issuedBooks = libraryRepository.findByStudentId(user.getId());

            // Convert LocalDate to String for frontend
            List<Map<String, Object>> response = new ArrayList<>();
            for (Library book : issuedBooks) {
                Map<String, Object> bookMap = new HashMap<>();
                bookMap.put("id", book.getId());
                bookMap.put("title", book.getTitle());
                bookMap.put("author", book.getAuthor());
                bookMap.put("isbn", book.getIsbn());
                bookMap.put("issuedAt", book.getIssuedAt() != null ? book.getIssuedAt().toString() : "");
                bookMap.put("dueDate", book.getDueDate() != null ? book.getDueDate().toString() : "");
                response.add(bookMap);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    @GetMapping("/attendance")
    public ResponseEntity<?> getAttendance(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Attendance> attendance = attendanceRepository.findByStudentId(user.getId());
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }




    @GetMapping("/attendance/subject/{subject}")
    public ResponseEntity<?> getAttendanceBySubject(@PathVariable String subject, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Attendance> attendance = attendanceRepository.findByStudentIdAndSubject(user.getId(), subject);
            Long present = attendanceRepository.countPresentByStudentAndSubject(user.getId(), subject);
            Long total = attendanceRepository.countTotalByStudentAndSubject(user.getId(), subject);

            Map<String, Object> result = new HashMap<>();
            result.put("attendance", attendance);
            result.put("present", present);
            result.put("total", total);
            result.put("percentage", total > 0 ? (present * 100.0 / total) : 0.0);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/marks")
    public ResponseEntity<?> getMarks(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Mark> marks = markRepository.findByStudentId(user.getId());
            Double cgpa = markRepository.calculateCGPA(user.getId());
            if (cgpa == null) cgpa = 0.0;

            Map<String, Object> result = new HashMap<>();
            result.put("marks", marks);
            result.put("cgpa", Math.round(cgpa * 100.0) / 100.0);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-feedback")
    public ResponseEntity<?> getMyFeedback(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Feedback> myFeedback = feedbackRepository.findByStudentId(user.getId());
            return ResponseEntity.ok(myFeedback);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/fees")
    public ResponseEntity<?> getFees(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Fee> fees = feeRepository.findByStudentId(user.getId());
            BigDecimal totalPaid = feeRepository.calculateTotalPaid(user.getId());
            BigDecimal totalPending = feeRepository.calculateTotalPending(user.getId());

            Map<String, Object> result = new HashMap<>();
            result.put("fees", fees);
            result.put("totalPaid", totalPaid != null ? totalPaid : BigDecimal.ZERO);
            result.put("totalPending", totalPending != null ? totalPending : BigDecimal.ZERO);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/feedback")
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, String> feedback, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Feedback newFeedback = new Feedback();
            newFeedback.setStudentId(user.getId());
            newFeedback.setTitle(feedback.get("title"));
            newFeedback.setMessage(feedback.get("message"));
            newFeedback.setCategory(Feedback.Category.valueOf(feedback.get("category")));

            feedbackRepository.save(newFeedback);
            return ResponseEntity.ok(Map.of("message", "Feedback submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/fees/{feeId}/pay")
    public ResponseEntity<?> payFee(@PathVariable Long feeId, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Fee fee = feeRepository.findById(feeId).orElse(null);
            if (fee == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Fee not found"));
            }

            if (!fee.getStudentId().equals(user.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized access"));
            }

            if (fee.getStatus() == Fee.PaymentStatus.PAID) {
                return ResponseEntity.badRequest().body(Map.of("error", "Fee already paid"));
            }

            // Update fee status to PAID
            fee.setStatus(Fee.PaymentStatus.PAID);
            fee.setPaidDate(LocalDateTime.now());
            fee.setPaymentMethod("Online Payment");
            fee.setTransactionId("TXN" + System.currentTimeMillis());

            feeRepository.save(fee);
            return ResponseEntity.ok(Map.of("message", "Fee paid successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        // Fetch notifications for STUDENT or ALL
        List<Notification> notifications = notificationRepository.findByTargetRoleOrAll(Notification.TargetRole.STUDENT);

        // Convert LocalDateTime to string for frontend
        List<Map<String, Object>> response = new ArrayList<>();
        for (Notification n : notifications) {
            Map<String, Object> notif = new HashMap<>();
            notif.put("id", n.getId());
            notif.put("title", n.getTitle());
            notif.put("message", n.getMessage());
            notif.put("createdBy", n.getCreatedBy());
            notif.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
            response.add(notif);
        }

        return ResponseEntity.ok(response);
    }
    // 1️⃣ Get student profile
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("name", user.getName());
        profile.put("username", user.getUsername());
        profile.put("role", user.getRole());
        profile.put("studentId", user.getStudentId());
        // Optional: add more fields if needed
        // profile.put("cgpa", user.getCgpa());

        return ResponseEntity.ok(profile);
    }


    @GetMapping("/timetable/today")
    public ResponseEntity<?> getTodayTimetable(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            // Get today's day of week
            String today = LocalDate.now().getDayOfWeek().toString();

            // Try to find actual timetable, if not found create mock data
            List<Timetable> timetable = timetableRepository.findByDayOfWeek(Timetable.DayOfWeek.valueOf(today));
            if (timetable.isEmpty()) {
                // Create mock timetable data
                List<Map<String, Object>> mockTimetable = new ArrayList<>();

                Map<String, Object> class1 = new HashMap<>();
                class1.put("id", 1L);
                class1.put("subject", "Operating Systems");
                class1.put("teacher", "Prof. Sharma");
                class1.put("classroom", "A101");
                class1.put("startTime", "09:00");
                class1.put("endTime", "10:00");
                class1.put("dayOfWeek", today);
                mockTimetable.add(class1);

                Map<String, Object> class2 = new HashMap<>();
                class2.put("id", 2L);
                class2.put("subject", "Computer Networks");
                class2.put("teacher", "Prof. Verma");
                class2.put("classroom", "B203");
                class2.put("startTime", "10:15");
                class2.put("endTime", "11:15");
                class2.put("dayOfWeek", today);
                mockTimetable.add(class2);

                Map<String, Object> class3 = new HashMap<>();
                class3.put("id", 3L);
                class3.put("subject", "Data Structures");
                class3.put("teacher", "Prof. Iyer");
                class3.put("classroom", "C102");
                class3.put("startTime", "11:30");
                class3.put("endTime", "12:30");
                class3.put("dayOfWeek", today);
                mockTimetable.add(class3);

                Map<String, Object> class4 = new HashMap<>();
                class4.put("id", 4L);
                class4.put("subject", "English");
                class4.put("teacher", "Prof. Gupta");
                class4.put("classroom", "D104");
                class4.put("startTime", "14:00");
                class4.put("endTime", "15:00");
                class4.put("dayOfWeek", today);
                mockTimetable.add(class4);

                Map<String, Object> result = new HashMap<>();
                result.put("timetable", mockTimetable);
                result.put("totalClasses", 4);
                result.put("totalHours", 4.0);
                result.put("day", today);

                return ResponseEntity.ok(result);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("timetable", timetable);
            result.put("totalClasses", timetable.size());
            result.put("totalHours", timetable.size() * 1.0); // Assuming 1 hour per class
            result.put("day", today);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/subjects")
    public ResponseEntity<?> getSubjects(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Subject> subjects = subjectRepository.findAll();
            if (subjects.isEmpty()) {
                // Create mock subjects
                List<Map<String, Object>> mockSubjects = new ArrayList<>();

                String[] subjectNames = {"Operating Systems", "Computer Networks", "Data Structures",
                        "Database Management", "Software Engineering", "Web Development"};
                String[] subjectCodes = {"CS301", "CS302", "CS303", "CS304", "CS305", "CS306"};

                for (int i = 0; i < subjectNames.length; i++) {
                    Map<String, Object> subject = new HashMap<>();
                    subject.put("id", (long)(i + 1));
                    subject.put("subjectCode", subjectCodes[i]);
                    subject.put("subjectName", subjectNames[i]);
                    subject.put("department", "Computer Science");
                    subject.put("credits", 3);
                    subject.put("semester", "6th Semester");
                    subject.put("academicYear", "2023-24");
                    mockSubjects.add(subject);
                }

                return ResponseEntity.ok(mockSubjects);
            }

            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Test Management Endpoints for Students
    @GetMapping("/tests")
    public ResponseEntity<?> getTests(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            // Get all active tests
            List<Test> tests = testRepository.findByIsActiveTrue();
            
            // Filter tests that are scheduled for today or future
            LocalDate today = LocalDate.now();
            List<Test> upcomingTests = tests.stream()
                .filter(test -> !test.getTestDate().isBefore(today))
                .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(upcomingTests);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tests/{testId}")
    public ResponseEntity<?> getTest(@PathVariable Long testId, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Test test = testRepository.findById(testId).orElse(null);
            if (test == null || !test.getIsActive()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Test not found"));
            }

            return ResponseEntity.ok(test);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/tests/{testId}/submit")
    public ResponseEntity<?> submitTest(@PathVariable Long testId, @RequestBody Map<String, Object> submissionData, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Test test = testRepository.findById(testId).orElse(null);
            if (test == null || !test.getIsActive()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Test not found"));
            }

            // Check if test is still open for submission
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime testEndTime = test.getTestDate().atTime(
                java.time.LocalTime.parse(test.getEndTime())
            );
            
            if (now.isAfter(testEndTime)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Test submission deadline has passed"));
            }

            // Check if student has already submitted
            Optional<TestSubmission> existingSubmission = testSubmissionRepository.findByTestIdAndStudentId(testId, user.getId());
            if (existingSubmission.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Test already submitted"));
            }

            TestSubmission submission = new TestSubmission();
            submission.setTestId(testId);
            submission.setStudentId(user.getId());
            submission.setSubmissionText(submissionData.get("submissionText").toString());
            submission.setSubmittedAt(LocalDateTime.now());
            submission.setStatus(TestSubmission.SubmissionStatus.SUBMITTED);

            testSubmissionRepository.save(submission);
            return ResponseEntity.ok(Map.of("message", "Test submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tests/{testId}/submission")
    public ResponseEntity<?> getTestSubmission(@PathVariable Long testId, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Optional<TestSubmission> submission = testSubmissionRepository.findByTestIdAndStudentId(testId, user.getId());
            if (submission.isEmpty()) {
                return ResponseEntity.ok(Map.of("submission", null, "message", "No submission found"));
            }

            return ResponseEntity.ok(Map.of("submission", submission.get(), "message", "Submission found"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get submission: " + e.getMessage()));
        }
    }

    @GetMapping("/test-submissions")
    public ResponseEntity<?> getMyTestSubmissions(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<TestSubmission> submissions = testSubmissionRepository.findByStudentId(user.getId());
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/test-results")
    public ResponseEntity<?> getTestResults(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            // Get all graded submissions for this student
            List<TestSubmission> gradedSubmissions = testSubmissionRepository.findByStudentId(user.getId())
                .stream()
                .filter(submission -> submission.getStatus() == TestSubmission.SubmissionStatus.GRADED)
                .collect(java.util.stream.Collectors.toList());

            // Get test details for each submission
            List<Map<String, Object>> results = new ArrayList<>();
            for (TestSubmission submission : gradedSubmissions) {
                Test test = testRepository.findById(submission.getTestId()).orElse(null);
                if (test != null) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("testId", test.getId());
                    result.put("testTitle", test.getTitle());
                    result.put("subject", test.getSubject());
                    result.put("maxMarks", test.getMaxMarks());
                    result.put("marksObtained", submission.getMarksObtained());
                    result.put("feedback", submission.getFeedback());
                    result.put("gradedBy", submission.getGradedBy());
                    result.put("gradedAt", submission.getGradedAt());
                    result.put("percentage", (submission.getMarksObtained() * 100.0) / test.getMaxMarks());
                    results.add(result);
                }
            }

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assignments")
    public ResponseEntity<?> getAssignments(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Assignment> assignments = assignmentRepository.findUpcomingAssignments(LocalDateTime.now());
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

