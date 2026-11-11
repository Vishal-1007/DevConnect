package com.developersconnect.mentor.config;

import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class UploadStaticResourceConfig implements WebMvcConfigurer {

    private final StreamMediaProperties properties;

    public UploadStaticResourceConfig(StreamMediaProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path base = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        String location = base.toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations(location)
            .setCachePeriod(3600);
    }
}
