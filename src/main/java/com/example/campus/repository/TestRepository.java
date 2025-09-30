package com.example.campus.repository;

import com.example.campus.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    
    // Find tests by subject
    List<Test> findBySubject(String subject);
    
    // Find tests by created by (faculty)
    List<Test> findByCreatedBy(String createdBy);
    
    // Find tests by date
    List<Test> findByTestDate(LocalDate testDate);
    
    // Find active tests
    List<Test> findByIsActiveTrue();
    
    // Find tests by subject and active status
    List<Test> findBySubjectAndIsActiveTrue(String subject);
    
    // Find tests by created by and active status
    List<Test> findByCreatedByAndIsActiveTrue(String createdBy);
    
    // Find tests by date range
    @Query("SELECT t FROM Test t WHERE t.testDate BETWEEN :startDate AND :endDate AND t.isActive = true")
    List<Test> findTestsByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Find upcoming tests
    @Query("SELECT t FROM Test t WHERE t.testDate >= :today AND t.isActive = true ORDER BY t.testDate ASC")
    List<Test> findUpcomingTests(@Param("today") LocalDate today);
    
    // Find tests by semester and academic year
    List<Test> findBySemesterAndAcademicYear(String semester, String academicYear);
    
    // Find tests by status
    List<Test> findByStatus(Test.TestStatus status);
}
