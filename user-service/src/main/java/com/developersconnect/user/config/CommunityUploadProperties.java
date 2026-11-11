package com.developersconnect.user.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.community-upload")
public class CommunityUploadProperties {

    private String uploadDir = "./uploads/community";
    private long maxImageBytes = 5L * 1024 * 1024;
    private long maxAttachmentBytes = 20L * 1024 * 1024;

    public String getUploadDir() {
        return uploadDir;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public long getMaxImageBytes() {
        return maxImageBytes;
    }

    public void setMaxImageBytes(long maxImageBytes) {
        this.maxImageBytes = maxImageBytes;
    }

    public long getMaxAttachmentBytes() {
        return maxAttachmentBytes;
    }

    public void setMaxAttachmentBytes(long maxAttachmentBytes) {
        this.maxAttachmentBytes = maxAttachmentBytes;
    }
}
