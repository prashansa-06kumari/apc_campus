package com.example.campus.repository;

import com.example.campus.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByTargetRole(Notification.TargetRole targetRole);

    List<Notification> findByTargetUserId(Long targetUserId);

    List<Notification> findByIsRead(Boolean isRead);

    // Notifications created by a specific user
    List<Notification> findByCreatedBy(String createdBy);

    // Notifications for a role OR ALL
    @Query("SELECT n FROM Notification n WHERE n.targetRole = :role OR n.targetRole = com.example.campus.entity.Notification.TargetRole.ALL ORDER BY n.createdAt DESC")
    List<Notification> findByTargetRoleOrAll(@Param("role") Notification.TargetRole role);


    // Fetch notifications created by a specific user OR targeted to a specific role (e.g., STUDENT)
    @Query("SELECT n FROM Notification n " +
            "WHERE n.createdBy = :createdBy OR n.targetRole = :role OR n.targetRole = com.example.campus.entity.Notification.TargetRole.ALL " +
            "ORDER BY n.createdAt DESC")
    List<Notification> findByCreatedByOrTargetRole(@Param("createdBy") String createdBy,
                                                   @Param("role") Notification.TargetRole role);


    @Query("SELECT n FROM Notification n " +
            "WHERE n.createdBy = :createdBy OR n.targetRole IN :roles " +
            "ORDER BY n.createdAt DESC")
    List<Notification> findByCreatedByOrTargetRoleIn(@Param("createdBy") String createdBy,
                                                     @Param("roles") List<Notification.TargetRole> roles);

}

