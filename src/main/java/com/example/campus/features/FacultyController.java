package com.example.campus.features;

import com.example.campus.entity.*;
import com.example.campus.repository.*;
import com.example.campus.user.User;
import com.example.campus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.example.campus.user.Role;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/faculty")
public class FacultyController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Autowired
    private MarkRepository markRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TimetableRepository timetableRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }


            // Today's schedule (mock data)
            List<String> todaySchedule = Arrays.asList("CS101 - 10:00 AM", "MA102 - 2:00 PM");

            // Assigned subjects
            List<String> assignedSubjects = Arrays.asList("CS101", "MA102");

            // Pending submissions to review
            List<AssignmentSubmission> pendingSubmissions = submissionRepository.findPendingSubmissionsByAssignment(1L);

            // Recent notifications
            List<Notification> notifications = notificationRepository.findByTargetRoleOrAll(Notification.TargetRole.FACULTY);
            notifications = notifications.stream().limit(5).toList();

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("todaySchedule", todaySchedule);
            dashboard.put("assignedSubjects", assignedSubjects);
            dashboard.put("pendingSubmissions", pendingSubmissions.size());
            dashboard.put("notifications", notifications);

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    @GetMapping("/students")
    public ResponseEntity<?> getStudentsForAttendance() {
        try {
            List<User> students = userRepository.findByRole(Role.STUDENT);
            List<Map<String, Object>> studentList = new ArrayList<>();

            for (User student : students) {
                Map<String, Object> studentData = new HashMap<>();
                studentData.put("studentId", student.getId());
                studentData.put("name", student.getUsername());
                studentList.add(studentData);
            }

            return ResponseEntity.ok(studentList);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/attendance/mark")
    public ResponseEntity<?> markAttendance(@RequestBody Map<String, Object> attendanceData,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null)
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));

            Long studentId = Long.valueOf(attendanceData.get("studentId").toString());
            LocalDate date = LocalDate.parse(attendanceData.get("date").toString());
            String status = attendanceData.get("status").toString();

            // ✅ Check if already marked by this faculty
            Optional<Attendance> existing = attendanceRepository
                    .findByStudentIdAndDateAndMarkedBy(studentId, date, user.getUsername());

            if (existing.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Attendance already marked for this student on this date by you"));
            }

            Attendance attendance = new Attendance();
            attendance.setStudentId(studentId);
            attendance.setDate(date);
            attendance.setStatus(Attendance.AttendanceStatus.valueOf(status));
            attendance.setMarkedBy(user.getUsername());
            attendance.setSubject("General");

            attendanceRepository.save(attendance);
            return ResponseEntity.ok(Map.of("message", "Attendance marked"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/attendance/bulk")
    public ResponseEntity<?> markBulkAttendance(@RequestBody Map<String, Object> attendanceData,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null)
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));

            LocalDate date = LocalDate.parse(attendanceData.get("date").toString());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> students = (List<Map<String, Object>>) attendanceData.get("students");

            List<Long> markedIds = new ArrayList<>();

            for (Map<String, Object> student : students) {
                Long studentId = Long.valueOf(student.get("studentId").toString());
                String status = student.get("status").toString();

                // ✅ Check duplicate before saving
                Optional<Attendance> existing = attendanceRepository
                        .findByStudentIdAndDateAndMarkedBy(studentId, date, user.getUsername());

                if (existing.isPresent()) {
                    markedIds.add(studentId);
                    continue; // skip duplicate
                }

                Attendance attendance = new Attendance();
                attendance.setStudentId(studentId);
                attendance.setDate(date);
                attendance.setStatus(Attendance.AttendanceStatus.valueOf(status));
                attendance.setMarkedBy(user.getUsername());
                attendance.setSubject("General");
                attendanceRepository.save(attendance);

                markedIds.add(studentId);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Bulk attendance marked",
                    "skipped", markedIds
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/notifications")
    public ResponseEntity<?> createNotification(@RequestBody Map<String, Object> notificationData, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Notification notification = new Notification();
            notification.setTitle(notificationData.get("title").toString());
            notification.setMessage(notificationData.get("message").toString());
            notification.setCreatedBy(user.getUsername());
            notification.setTargetRole(Notification.TargetRole.valueOf(notificationData.get("targetRole").toString()));

            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("message", "Notification created successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            List<Notification> notifications = notificationRepository.findByTargetRoleOrAll(Notification.TargetRole.FACULTY);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/notifications/{id}")
    public ResponseEntity<?> updateNotification(@PathVariable Long id, @RequestBody Map<String, Object> notificationData, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Notification notification = notificationRepository.findById(id).orElse(null);
            if (notification == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Notification not found"));
            }

            notification.setTitle(notificationData.get("title").toString());
            notification.setMessage(notificationData.get("message").toString());
            notification.setTargetRole(Notification.TargetRole.valueOf(notificationData.get("targetRole").toString()));

            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("message", "Notification updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Notification notification = notificationRepository.findById(id).orElse(null);
            if (notification == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Notification not found"));
            }

            notificationRepository.delete(notification);
            return ResponseEntity.ok(Map.of("message", "Notification deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            // Try to find faculty profile, if not found create mock data
            Faculty faculty = facultyRepository.findByEmail(user.getUsername()).orElse(null);
            if (faculty == null) {
                // Create mock faculty profile
                Map<String, Object> mockProfile = new HashMap<>();
                mockProfile.put("id", user.getId());
                mockProfile.put("name", "Dr. Sarah Johnson");
                mockProfile.put("employeeId", "FAC2023001");
                mockProfile.put("department", "Computer Science");
                mockProfile.put("email", user.getUsername());
                mockProfile.put("phone", "+91 9876543210");
                mockProfile.put("address", "456 Faculty Street, City, State");
                mockProfile.put("designation", "Associate Professor");
                mockProfile.put("qualification", "Ph.D. in Computer Science");
                mockProfile.put("experience", "8 years");
                mockProfile.put("coursesTaught", "Operating Systems, Computer Networks, Data Structures");
                return ResponseEntity.ok(mockProfile);
            }

            return ResponseEntity.ok(faculty);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
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
                // Create mock timetable data for faculty
                List<Map<String, Object>> mockTimetable = new ArrayList<>();

                Map<String, Object> class1 = new HashMap<>();
                class1.put("id", 1L);
                class1.put("subject", "Operating Systems");
                class1.put("teacher", "Dr. Sarah Johnson");
                class1.put("classroom", "A101");
                class1.put("startTime", "09:00");
                class1.put("endTime", "10:00");
                class1.put("dayOfWeek", today);
                mockTimetable.add(class1);

                Map<String, Object> class2 = new HashMap<>();
                class2.put("id", 2L);
                class2.put("subject", "Computer Networks");
                class2.put("teacher", "Dr. Sarah Johnson");
                class2.put("classroom", "B203");
                class2.put("startTime", "10:15");
                class2.put("endTime", "11:15");
                class2.put("dayOfWeek", today);
                mockTimetable.add(class2);

                Map<String, Object> class3 = new HashMap<>();
                class3.put("id", 3L);
                class3.put("subject", "Data Structures");
                class3.put("teacher", "Dr. Sarah Johnson");
                class3.put("classroom", "C102");
                class3.put("startTime", "11:30");
                class3.put("endTime", "12:30");
                class3.put("dayOfWeek", today);
                mockTimetable.add(class3);

                Map<String, Object> result = new HashMap<>();
                result.put("timetable", mockTimetable);
                result.put("totalClasses", 3);
                result.put("totalHours", 3.0);
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


    @GetMapping("/timetable/week")
    public ResponseEntity<?> getWeeklyTimetable(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            // Create mock weekly timetable data
            Map<String, List<Map<String, Object>>> weeklyTimetable = new HashMap<>();

            String[] days = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"};
            String[] subjects = {"Operating Systems", "Computer Networks", "Data Structures", "Database Management", "Software Engineering"};
            String[] classrooms = {"A101", "B203", "C102", "D301", "E205"};
            String[] times = {"09:00-10:00", "10:15-11:15", "11:30-12:30", "14:00-15:00", "15:15-16:15"};

            for (String day : days) {
                List<Map<String, Object>> daySchedule = new ArrayList<>();

                for (int i = 0; i < 3; i++) { // 3 classes per day
                    Map<String, Object> classInfo = new HashMap<>();
                    classInfo.put("id", (long) (i + 1));
                    classInfo.put("subject", subjects[i % subjects.length]);
                    classInfo.put("teacher", "Dr. Sarah Johnson");
                    classInfo.put("classroom", classrooms[i % classrooms.length]);
                    classInfo.put("startTime", times[i % times.length].split("-")[0]);
                    classInfo.put("endTime", times[i % times.length].split("-")[1]);
                    classInfo.put("dayOfWeek", day);
                    daySchedule.add(classInfo);
                }

                weeklyTimetable.put(day, daySchedule);
            }

            return ResponseEntity.ok(weeklyTimetable);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

