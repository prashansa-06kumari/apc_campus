package com.example.campus.repository;

import com.example.campus.entity.Library;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LibraryRepository extends JpaRepository<Library, Long> {
    List<Library> findByStudentId(Long studentId);
    boolean existsByIsbn(String isbn);
}
