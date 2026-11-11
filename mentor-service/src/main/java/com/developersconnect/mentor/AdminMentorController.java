package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.AdminMentorDetailResponse;
import com.developersconnect.mentor.dto.AdminMentorListResponse;
import com.developersconnect.mentor.service.AdminMentorService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/mentors")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMentorController {

    private final AdminMentorService adminMentorService;

    public AdminMentorController(AdminMentorService adminMentorService) {
        this.adminMentorService = adminMentorService;
    }

    @GetMapping
    public ResponseEntity<List<AdminMentorListResponse>> list() {
        return ResponseEntity.ok(adminMentorService.listForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminMentorDetailResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(adminMentorService.getForAdmin(id));
    }

    @PostMapping("/{id}/suspend")
    public ResponseEntity<AdminMentorDetailResponse> suspend(@PathVariable UUID id) {
        return ResponseEntity.ok(adminMentorService.suspendMentor(id));
    }
}
