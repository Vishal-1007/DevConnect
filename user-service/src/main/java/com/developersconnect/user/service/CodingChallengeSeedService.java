package com.developersconnect.user.service;

import com.developersconnect.user.dto.CodingProblemDtos.CreateProblemRequest;
import com.developersconnect.user.dto.CodingProblemDtos.ExampleDto;
import com.developersconnect.user.dto.CodingProblemDtos.TestCaseDto;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.repository.CodingChallengeRepository;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(8)
public class CodingChallengeSeedService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CodingChallengeSeedService.class);

    private final CodingChallengeRepository challengeRepository;
    private final CodingProblemService problemService;

    public CodingChallengeSeedService(
        CodingChallengeRepository challengeRepository,
        CodingProblemService problemService
    ) {
        this.challengeRepository = challengeRepository;
        this.problemService = problemService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (challengeRepository.count() > 0) {
            return;
        }
        log.info("Seeding initial coding problems");
        seedProblems().forEach(request -> problemService.create(request, null, true));
    }

    private List<CreateProblemRequest> seedProblems() {
        return List.of(
            new CreateProblemRequest(
                "Two Sum",
                "Given an integer array nums and an integer target, return indices of the two numbers such that they add up to target.",
                "DSA", "easy",
                List.of("java", "javascript", "python", "typescript"),
                List.of("Array", "HashMap"),
                List.of("Amazon", "Google", "Meta"),
                Map.of(
                    "java", "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n}",
                    "javascript", "function twoSum(nums, target) {\n  return [];\n}",
                    "python", "def two_sum(nums, target):\n    return []",
                    "typescript", "function twoSum(nums: number[], target: number): number[] {\n  return [];\n}"
                ),
                List.of(
                    new TestCaseDto("Test Case 1", "nums = [2,7,11,15], target = 9", "[0,1]",
                        "console.log(JSON.stringify(twoSum([2,7,11,15], 9)));",
                        "print(two_sum([2,7,11,15], 9))",
                        "System.out.println(java.util.Arrays.toString(s.twoSum(new int[]{2,7,11,15}, 9)));"),
                    new TestCaseDto("Test Case 2", "nums = [3,2,4], target = 6", "[1,2]",
                        "console.log(JSON.stringify(twoSum([3,2,4], 6)));",
                        "print(two_sum([3,2,4], 6))",
                        "System.out.println(java.util.Arrays.toString(s.twoSum(new int[]{3,2,4}, 6)));")
                ),
                "Use a hash map to store complements for O(n) time.",
                List.of("Use a hash map for O(n) time", "Watch for duplicate values"),
                List.of("2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"),
                List.of(new ExampleDto("nums=[2,7,11,15], target=9", "[0,1]")),
                CodingChallenge.STATUS_PUBLISHED
            )
        );
    }
}

