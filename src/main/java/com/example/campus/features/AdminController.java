package com.example.campus.features;

import com.example.campus.entity.*;
import com.example.campus.repository.*;
import com.example.campus.user.User;
import com.example.campus.user.UserRepository;
import com.example.campus.user.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import com.example.campus.entity.Library;
import com.example.campus.repository.LibraryRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")

public class AdminController {

    @Autowired
    private UserRepository userRepository;
    
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
    private LibraryRepository libraryRepository;
    
    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;




    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // System statistics
            long totalStudents = userRepository.findAll().stream().filter(u -> u.getRole() == Role.STUDENT).count();
            long totalFaculty = userRepository.findAll().stream().filter(u -> u.getRole() == Role.FACULTY).count();
            long totalAssignments = assignmentRepository.count();
            long pendingFeedback = feedbackRepository.findPendingFeedback().size();
            
            // Fee statistics
            BigDecimal totalFeesCollected = feeRepository.findAll().stream()
                .filter(f -> f.getStatus() == Fee.PaymentStatus.PAID)
                .map(Fee::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal pendingFees = feeRepository.findAll().stream()
                .filter(f -> f.getStatus() == Fee.PaymentStatus.PENDING)
                .map(Fee::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("totalStudents", totalStudents);
            dashboard.put("totalFaculty", totalFaculty);
            dashboard.put("totalAssignments", totalAssignments);
            dashboard.put("pendingFeedback", pendingFeedback);
            dashboard.put("totalFeesCollected", totalFeesCollected);
            dashboard.put("pendingFees", pendingFees);
            dashboard.put("libraryBooks", 120); // Mock data
            dashboard.put("activeNotifications", notificationRepository.count());

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<User> users = userRepository.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    private String generateStudentId() {
        String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
        long count = userRepository.count() + 1;
        return "STU" + year + String.format("%04d", count);
    }



    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userData, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            System.out.println("Incoming userData: " + userData);

            if (userRepository.existsByUsername(userData.get("username").toString())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }

            User user = new User();
            user.setUsername(userData.get("username").toString());
            user.setPassword(passwordEncoder.encode(userData.get("password").toString()));

            String roleStr = userData.get("role").toString().toUpperCase();
            Role role = Role.valueOf(roleStr);
            user.setRole(role);

            if (role == Role.STUDENT && (user.getStudentId() == null || user.getStudentId().isEmpty())) {
                String studentId = generateStudentId();
                user.setStudentId(studentId);
                System.out.println("Generated studentId: " + studentId);
            }


            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User created successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Fetch all students
    @GetMapping("/students")
    public List<Map<String, Object>> getAllStudents() {
        List<User> students = userRepository.findByRole(Role.STUDENT);
        List<Map<String, Object>> response = new ArrayList<>();
        for (User student : students) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", student.getId());
            map.put("name", student.getName() != null ? student.getName() : student.getUsername());
            map.put("rollNumber", student.getStudentId() != null ? student.getStudentId() : "N/A");
            map.put("department", "Computer Science"); // Default department
            map.put("email", student.getUsername() + "@university.edu");
            map.put("phone", "N/A");
            response.add(map);
        }
        return response;
    }

    // Mark student attendance
    @PostMapping("/attendance")
    public ResponseEntity<?> markAttendance(@RequestBody Map<String, Object> attendanceData, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Long studentId = Long.valueOf(attendanceData.get("studentId").toString());
            
            // Get student username from database
            User student = userRepository.findById(studentId).orElse(null);
            if (student == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Student not found"));
            }
            
            Attendance attendance = new Attendance();
            attendance.setStudentId(studentId);
            attendance.setStudentName(student.getUsername());
            attendance.setSubject(attendanceData.get("subject").toString());
            attendance.setStatus(Attendance.AttendanceStatus.valueOf(attendanceData.get("status").toString()));
            attendance.setDate(LocalDate.parse(attendanceData.get("date").toString()));
            attendance.setMarkedBy(user.getUsername());

            attendanceRepository.save(attendance);
            return ResponseEntity.ok(Map.of("message", "Attendance marked successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Create sample students for testing
    @PostMapping("/students/sample")
    public ResponseEntity<?> createSampleStudents() {
        try {
            List<Student> sampleStudents = Arrays.asList(
                new Student("CS001", "John Doe", "Computer Science", "john.doe@email.com", "1234567890", "123 Main St", 3.5, 3.2, 3.8, 3.6, "2024-25", "3"),
                new Student("CS002", "Jane Smith", "Computer Science", "jane.smith@email.com", "1234567891", "456 Oak Ave", 3.8, 3.6, 3.9, 3.7, "2024-25", "3"),
                new Student("CS003", "Mike Johnson", "Computer Science", "mike.johnson@email.com", "1234567892", "789 Pine Rd", 3.2, 3.0, 3.4, 3.3, "2024-25", "3"),
                new Student("IT001", "Sarah Wilson", "Information Technology", "sarah.wilson@email.com", "1234567893", "321 Elm St", 3.6, 3.4, 3.7, 3.5, "2024-25", "3"),
                new Student("IT002", "David Brown", "Information Technology", "david.brown@email.com", "1234567894", "654 Maple Dr", 3.4, 3.2, 3.5, 3.4, "2024-25", "3")
            );
            
            studentRepository.saveAll(sampleStudents);
            return ResponseEntity.ok("Sample students created successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/library/issue")
    public ResponseEntity<?> issueBook(@RequestBody Library request) {
        User student = userRepository.findById(request.getStudent().getId()).orElse(null);

        if (student == null || student.getRole() != Role.STUDENT) {
            return ResponseEntity.badRequest().body("Invalid student ID");
        }

        if (libraryRepository.existsByIsbn(request.getIsbn())) {
            return ResponseEntity.badRequest().body("ISBN already issued");
        }

        if (request.getDueDate() == null || request.getDueDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body("Due date must be today or later");
        }

        Library libraryRecord = new Library();
        libraryRecord.setStudent(student);
        libraryRecord.setTitle(request.getTitle());
        libraryRecord.setAuthor(request.getAuthor());
        libraryRecord.setIsbn(request.getIsbn());
        libraryRecord.setDueDate(request.getDueDate());  // ✅ just assign it
        libraryRecord.setIssuedAt(LocalDate.now());

        return ResponseEntity.ok(libraryRepository.save(libraryRecord));
    }

    // Delete issued book
    @DeleteMapping("/library/{id}")
    public ResponseEntity<?> deleteIssue(@PathVariable Long id) {
        if (!libraryRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("Issued book not found");
        }
        libraryRepository.deleteById(id);
        return ResponseEntity.ok("Deleted successfully");
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            userRepository.delete(user);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    @GetMapping("/attendance/reports")
    public ResponseEntity<?> getAttendanceReports(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Attendance> allAttendance = attendanceRepository.findAll();
            return ResponseEntity.ok(allAttendance);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/marks")
    public ResponseEntity<?> getAllMarks(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Mark> allMarks = markRepository.findAll();
            List<Map<String, Object>> marksWithStudentNames = new ArrayList<>();
            
            for (Mark mark : allMarks) {
                Map<String, Object> markData = new HashMap<>();
                markData.put("id", mark.getId());
                markData.put("studentId", mark.getStudentId());
                markData.put("studentName", "Student " + mark.getStudentId()); // You can enhance this to get actual student name
                markData.put("subject", mark.getSubject());
                markData.put("examType", mark.getExamType());
                markData.put("marksObtained", mark.getMarksObtained());
                markData.put("maxMarks", mark.getMaxMarks());
                markData.put("semester", mark.getSemester());
                markData.put("academicYear", mark.getAcademicYear());
                markData.put("createdAt", mark.getCreatedAt());
                marksWithStudentNames.add(markData);
            }
            
            return ResponseEntity.ok(marksWithStudentNames);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/marks/bulk")
    public ResponseEntity<?> addBulkMarks(@RequestBody List<Map<String, Object>> marksData, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Mark> marksToSave = new ArrayList<>();
            
            for (Map<String, Object> markData : marksData) {
                Mark mark = new Mark();
                mark.setStudentId(((Number) markData.get("studentId")).longValue());
                mark.setSubject((String) markData.get("subject"));
                mark.setExamType(Mark.ExamType.valueOf((String) markData.get("examType")));
                mark.setMarksObtained(((Number) markData.get("marksObtained")).intValue());
                mark.setMaxMarks(((Number) markData.get("maxMarks")).intValue());
                mark.setSemester((String) markData.get("semester"));
                mark.setAcademicYear((String) markData.get("academicYear"));
                mark.setEnteredBy(userDetails.getUsername());
                mark.setCreatedAt(LocalDateTime.now());
                
                marksToSave.add(mark);
            }
            
            markRepository.saveAll(marksToSave);
            return ResponseEntity.ok("Marks added successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/marks/reports")
    public ResponseEntity<?> getMarksReports(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Mark> allMarks = markRepository.findAll();
            return ResponseEntity.ok(allMarks);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/fees/reports")
    public ResponseEntity<?> getFeesReports(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Fee> allFees = feeRepository.findAll();
            return ResponseEntity.ok(allFees);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assignments/reports")
    public ResponseEntity<?> getAssignmentsReports(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Assignment> allAssignments = assignmentRepository.findAll();
            return ResponseEntity.ok(allAssignments);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/feedback")
    public ResponseEntity<?> getAllFeedback(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Feedback> allFeedback = feedbackRepository.findAll();
            return ResponseEntity.ok(allFeedback);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/feedback/{feedbackId}/respond")
    public ResponseEntity<?> respondToFeedback(@PathVariable Long feedbackId, @RequestBody Map<String, String> response, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
            if (feedback == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Feedback not found"));
            }

            feedback.setAdminResponse(response.get("response"));
            feedback.setRespondedBy(userDetails.getUsername());
            feedback.setRespondedAt(LocalDateTime.now());
            feedback.setStatus(Feedback.Status.RESOLVED);

            feedbackRepository.save(feedback);
            return ResponseEntity.ok(Map.of("message", "Response added successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/notifications")
    public ResponseEntity<?> createNotification(@RequestBody Map<String, Object> notificationData, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Notification notification = new Notification();
            notification.setTitle(notificationData.get("title").toString());
            notification.setMessage(notificationData.get("message").toString());
            notification.setCreatedBy(userDetails.getUsername());
            notification.setTargetRole(Notification.TargetRole.valueOf(notificationData.get("targetRole").toString()));

            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("message", "Notification created successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getAllNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Notification> notifications = notificationRepository.findAll();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }



    @PutMapping("/notifications/{id}")
    public ResponseEntity<?> updateNotification(
            @PathVariable Long id,
            @RequestBody Notification request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return notificationRepository.findById(id).map(notification -> {
            notification.setTitle(request.getTitle());
            notification.setMessage(request.getMessage());
            notification.setTargetRole(request.getTargetRole());
            notification.setCreatedBy(userDetails.getUsername());
            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("message", "Notification updated successfully"));
        }).orElse(ResponseEntity.status(404).body(Map.of("error", "Notification not found")));
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        return notificationRepository.findById(id).map(notification -> {
            notificationRepository.delete(notification);
            return ResponseEntity.ok(Map.of("message", "Notification deleted successfully"));
        }).orElse(ResponseEntity.status(404).body(Map.of("error", "Notification not found")));
    }

@PostMapping("/fees")
    public ResponseEntity<?> createFee(@RequestBody Map<String, Object> feeData, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Fee fee = new Fee();
            fee.setStudentId(Long.valueOf(feeData.get("studentId").toString()));
            fee.setFeeType(Fee.FeeType.valueOf(feeData.get("feeType").toString()));
            fee.setAmount(new BigDecimal(feeData.get("amount").toString()));
            fee.setDueDate(LocalDateTime.parse(feeData.get("dueDate").toString()));

            feeRepository.save(fee);
            return ResponseEntity.ok(Map.of("message", "Fee created successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Map<String, Object> analytics = new HashMap<>();
            
            // Attendance analytics
            long totalAttendanceRecords = attendanceRepository.count();
            long presentCount = attendanceRepository.findAll().stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT)
                .count();
            
            // Marks analytics
            List<Mark> allMarks = markRepository.findAll();
            double averageMarks = allMarks.stream()
                .mapToInt(Mark::getMarksObtained)
                .average()
                .orElse(0.0);
            
            // Fee analytics
            BigDecimal totalFees = feeRepository.findAll().stream()
                .map(Fee::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            analytics.put("totalAttendanceRecords", totalAttendanceRecords);
            analytics.put("attendancePercentage", totalAttendanceRecords > 0 ? (presentCount * 100.0 / totalAttendanceRecords) : 0.0);
            analytics.put("averageMarks", Math.round(averageMarks * 100.0) / 100.0);
            analytics.put("totalFees", totalFees);
            analytics.put("totalStudents", userRepository.findAll().stream().filter(u -> u.getRole() == Role.STUDENT).count());
            analytics.put("totalFaculty", userRepository.findAll().stream().filter(u -> u.getRole() == Role.FACULTY).count());

            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}


