import java.nio.charset.StandardCharsets;
import org.springframework.web.util.UriComponentsBuilder;

public class UriEncodeCheck {
  public static void main(String[] args) {
    String redirectUri = "http://localhost:8089/api/recruiter/integrations/oauth/zoom/callback";
    String oldWay = UriComponentsBuilder.fromHttpUrl("https://zoom.us/oauth/authorize")
        .queryParam("response_type", "code")
        .queryParam("client_id", "abc")
        .queryParam("redirect_uri", redirectUri)
        .queryParam("state", "state123")
        .build()
        .encode(StandardCharsets.UTF_8)
        .toUriString();
    String newWay = UriComponentsBuilder.fromHttpUrl("https://zoom.us/oauth/authorize")
        .queryParam("response_type", "code")
        .queryParam("client_id", "abc")
        .queryParam("redirect_uri", redirectUri)
        .queryParam("state", "state123")
        .encode(StandardCharsets.UTF_8)
        .build()
        .toUriString();
    System.out.println("OLD: " + oldWay);
    System.out.println("NEW: " + newWay);
    System.out.println("OLD contains encoded: " + oldWay.contains("redirect_uri=http%3A"));
    System.out.println("NEW contains encoded: " + newWay.contains("redirect_uri=http%3A"));
  }
}
