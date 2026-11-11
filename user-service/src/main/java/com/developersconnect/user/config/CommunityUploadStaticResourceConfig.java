package com.developersconnect.user.config;

import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CommunityUploadStaticResourceConfig implements WebMvcConfigurer {

    private final CommunityUploadProperties properties;

    public CommunityUploadStaticResourceConfig(CommunityUploadProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path base = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        String location = base.toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/uploads/community/**")
            .addResourceLocations(location)
            .setCachePeriod(3600);
    }
}
