package com.developersconnect.user.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import com.developersconnect.user.dto.CodingProblemDtos.TestCaseDto;
import com.developersconnect.user.dto.PairProgrammingDtos.RunPairCodeResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.TestCaseResultResponse;

@Service
public class PairCodeRunnerService {

    private static final long TIMEOUT_SECONDS = 8;

    private final CodingProblemService codingProblemService;

    public PairCodeRunnerService(CodingProblemService codingProblemService) {
        this.codingProblemService = codingProblemService;
    }

    public RunPairCodeResponse run(String code, String language, String problemId) {
        List<TestCase> cases = testCasesFor(problemId);
        if (cases.isEmpty()) {
            return new RunPairCodeResponse(false, "", "No test cases configured for this problem.", 0, 0, List.of());
        }

        return switch (normalizeLanguage(language)) {
            case "javascript" -> runJavaScript(code, cases);
            case "python" -> runPython(code, cases);
            case "java" -> runJava(code, cases);
            default -> new RunPairCodeResponse(
                false, "", "Unsupported language for execution: " + language, 0, 0, List.of()
            );
        };
    }

    private RunPairCodeResponse runJavaScript(String code, List<TestCase> cases) {
        long start = System.currentTimeMillis();
        List<TestCaseResultResponse> results = new ArrayList<>();
        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();
        boolean allPassed = true;

        for (TestCase testCase : cases) {
            String wrapped = wrapJavaScript(code, testCase);
            ProcessResult result = exec(new String[] { "node", "-e", wrapped });
            stdout.append(result.stdout());
            if (!result.stderr().isBlank()) stderr.append(result.stderr()).append('\n');
            boolean passed = result.exitCode() == 0 && result.stdout().trim().contains(testCase.expected());
            if (!passed) allPassed = false;
            results.add(new TestCaseResultResponse(
                testCase.name(),
                testCase.input(),
                testCase.expected(),
                result.stdout().trim(),
                passed,
                result.durationMs()
            ));
        }

        return new RunPairCodeResponse(
            allPassed,
            stdout.toString(),
            stderr.toString(),
            System.currentTimeMillis() - start,
            0,
            results
        );
    }

    private RunPairCodeResponse runPython(String code, List<TestCase> cases) {
        long start = System.currentTimeMillis();
        List<TestCaseResultResponse> results = new ArrayList<>();
        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();
        boolean allPassed = true;

        for (TestCase testCase : cases) {
            String wrapped = wrapPython(code, testCase);
            ProcessResult result = exec(new String[] { "python", "-c", wrapped });
            stdout.append(result.stdout());
            if (!result.stderr().isBlank()) stderr.append(result.stderr()).append('\n');
            boolean passed = result.exitCode() == 0 && normalizeOutput(result.stdout()).equals(normalizeOutput(testCase.expected()));
            if (!passed) allPassed = false;
            results.add(new TestCaseResultResponse(
                testCase.name(),
                testCase.input(),
                testCase.expected(),
                result.stdout().trim(),
                passed,
                result.durationMs()
            ));
        }

        return new RunPairCodeResponse(
            allPassed,
            stdout.toString(),
            stderr.toString(),
            System.currentTimeMillis() - start,
            0,
            results
        );
    }

    private RunPairCodeResponse runJava(String code, List<TestCase> cases) {
        long start = System.currentTimeMillis();
        List<TestCaseResultResponse> results = new ArrayList<>();
        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();
        boolean allPassed = true;

        try {
            Path dir = Files.createTempDirectory("dc-pair-java-");
            Path source = dir.resolve("Solution.java");
            Files.writeString(source, ensurePublicClass(code), StandardCharsets.UTF_8);

            ProcessResult compile = exec(new String[] { "javac", source.toString() }, dir);
            if (compile.exitCode() != 0) {
                return new RunPairCodeResponse(
                    false, compile.stdout(), compile.stderr(), System.currentTimeMillis() - start, 0, List.of()
                );
            }

            for (TestCase testCase : cases) {
                Path runner = dir.resolve("Runner.java");
                Files.writeString(runner, javaRunner(testCase), StandardCharsets.UTF_8);
                ProcessResult compileRunner = exec(new String[] { "javac", "-cp", dir.toString(), runner.toString() }, dir);
                if (compileRunner.exitCode() != 0) {
                    stderr.append(compileRunner.stderr());
                    allPassed = false;
                    continue;
                }
                ProcessResult result = exec(new String[] { "java", "-cp", dir.toString(), "Runner" }, dir);
                stdout.append(result.stdout());
                if (!result.stderr().isBlank()) stderr.append(result.stderr()).append('\n');
                boolean passed = result.exitCode() == 0 && normalizeOutput(result.stdout()).equals(normalizeOutput(testCase.expected()));
                if (!passed) allPassed = false;
                results.add(new TestCaseResultResponse(
                    testCase.name(),
                    testCase.input(),
                    testCase.expected(),
                    result.stdout().trim(),
                    passed,
                    result.durationMs()
                ));
            }
        } catch (IOException ex) {
            return new RunPairCodeResponse(false, "", ex.getMessage(), System.currentTimeMillis() - start, 0, List.of());
        }

        return new RunPairCodeResponse(
            allPassed,
            stdout.toString(),
            stderr.toString(),
            System.currentTimeMillis() - start,
            0,
            results
        );
    }

    private String wrapJavaScript(String code, TestCase testCase) {
        return code + "\n" + testCase.jsInvoke();
    }

    private String wrapPython(String code, TestCase testCase) {
        return code + "\n" + testCase.pyInvoke();
    }

    private String ensurePublicClass(String code) {
        if (code.contains("public class")) return code;
        return code.replaceFirst("class\\s+", "public class ");
    }

    private String javaRunner(TestCase testCase) {
        return """
            public class Runner {
              public static void main(String[] args) {
                Solution s = new Solution();
                %s
              }
            }
            """.formatted(testCase.javaInvoke());
    }

    private ProcessResult exec(String[] command) {
        return exec(command, null);
    }

    private ProcessResult exec(String[] command, Path workDir) {
        long start = System.currentTimeMillis();
        ProcessBuilder builder = new ProcessBuilder(command);
        if (workDir != null) builder.directory(workDir.toFile());
        builder.redirectErrorStream(false);
        try {
            Process process = builder.start();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new ProcessResult(124, "", "Execution timed out", System.currentTimeMillis() - start);
            }
            return new ProcessResult(
                process.exitValue(),
                readStream(process.getInputStream()),
                readStream(process.getErrorStream()),
                System.currentTimeMillis() - start
            );
        } catch (IOException | InterruptedException ex) {
            Thread.currentThread().interrupt();
            return new ProcessResult(1, "", ex.getMessage(), System.currentTimeMillis() - start);
        }
    }

    private String readStream(java.io.InputStream stream) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            return reader.lines().reduce("", (a, b) -> a.isEmpty() ? b : a + "\n" + b);
        }
    }

    private String normalizeLanguage(String language) {
        if (language == null) return "";
        return language.toLowerCase().replace("nodejs", "javascript").replace("react", "javascript");
    }

    private String normalizeOutput(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", "");
    }

    private List<TestCase> testCasesFor(String problemId) {
        if (problemId == null || problemId.isBlank()) {
            return List.of();
        }
        try {
            UUID challengeId = UUID.fromString(problemId);
            List<TestCase> cases = new ArrayList<>();
            for (TestCaseDto dto : codingProblemService.testCasesFor(challengeId)) {
                cases.add(new TestCase(
                    dto.name(),
                    dto.input(),
                    dto.expected(),
                    dto.jsInvoke(),
                    dto.pyInvoke(),
                    dto.javaInvoke()
                ));
            }
            return cases;
        } catch (IllegalArgumentException ex) {
            return List.of();
        }
    }

    private record TestCase(
        String name,
        String input,
        String expected,
        String jsInvoke,
        String pyInvoke,
        String javaInvoke
    ) {}

    private record ProcessResult(int exitCode, String stdout, String stderr, long durationMs) {}
}
