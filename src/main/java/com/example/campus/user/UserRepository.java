package com.example.campus.user;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
	List<User> findByRole(Role role);
	Optional<User> findByUsername(String username);
	boolean existsByUsername(String username);
}


