package com.example.campus.repository;

import com.example.campus.entity.TestSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestSubmissionRepository extends JpaRepository<TestSubmission, Long> {
    
    // Find submission by test and student
    Optional<TestSubmission> findByTestIdAndStudentId(Long testId, Long studentId);
    
    // Find all submissions for a test
    List<TestSubmission> findByTestId(Long testId);
    
    // Find all submissions by a student
    List<TestSubmission> findByStudentId(Long studentId);
    
    // Find submissions by status
    List<TestSubmission> findByStatus(TestSubmission.SubmissionStatus status);
    
    // Find submissions for a test by status
    List<TestSubmission> findByTestIdAndStatus(Long testId, TestSubmission.SubmissionStatus status);
    
    // Find graded submissions for a test
    @Query("SELECT ts FROM TestSubmission ts WHERE ts.testId = :testId AND ts.status = 'GRADED'")
    List<TestSubmission> findGradedSubmissionsByTestId(@Param("testId") Long testId);
    
    // Find pending submissions for a test
    @Query("SELECT ts FROM TestSubmission ts WHERE ts.testId = :testId AND ts.status = 'SUBMITTED'")
    List<TestSubmission> findPendingSubmissionsByTestId(@Param("testId") Long testId);
    
    // Count submissions by test
    Long countByTestId(Long testId);
    
    // Count submissions by test and status
    Long countByTestIdAndStatus(Long testId, TestSubmission.SubmissionStatus status);
    
    // Find submissions graded by a faculty member
    List<TestSubmission> findByGradedBy(String gradedBy);
    
    // Find average marks for a test
    @Query("SELECT AVG(ts.marksObtained) FROM TestSubmission ts WHERE ts.testId = :testId AND ts.status = 'GRADED'")
    Double findAverageMarksByTestId(@Param("testId") Long testId);
}
