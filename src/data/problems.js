export const PROBLEMS = [
    {
        id: 'two-sum',
        title: '1. Two Sum',
        difficulty: 'Easy',
        tags: ['Array', 'Hash Table'],
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
        examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
            { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
            { input: 'nums = [3,3], target = 6', output: '[0,1]' }
        ],
        constraints: [
            '2 <= nums.length <= 10^4',
            '-10^9 <= nums[i] <= 10^9',
            '-10^9 <= target <= 10^9',
            'Only one valid answer exists.'
        ],
        hints: [
            'A really brute force way would be to search for all possible pairs of numbers but that would be too slow.',
            'The second train of thought is, can we use a hash map to store the numbers we have seen so far?'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};`,
            python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        `,
            java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`,
            cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`
        },
        functionName: 'twoSum',
        testCases: [
            { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
            { input: [[3, 2, 4], 6], expected: [1, 2] },
            { input: [[3, 3], 6], expected: [0, 1] },
            { input: [[1, 2, 3, 4, 5], 9], expected: [3, 4] }
        ]
    },
    {
        id: 'palindrome-number',
        title: '9. Palindrome Number',
        difficulty: 'Easy',
        tags: ['Math'],
        description: `Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise.`,
        examples: [
            { input: 'x = 121', output: 'true', explanation: '121 reads as 121 from left to right and from right to left.' },
            { input: 'x = -121', output: 'false', explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.' },
            { input: 'x = 10', output: 'false', explanation: 'Reads 01 from right to left. Therefore it is not a palindrome.' }
        ],
        constraints: [
            '-2^31 <= x <= 2^31 - 1'
        ],
        hints: [
            'Beware of overflow when you reverse the integer.',
            'Could you solve it without converting the integer to a string?'
        ],
        starterCode: {
            javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
var isPalindrome = function(x) {
    
};`,
            python: `class Solution:
    def isPalindrome(self, x: int) -> bool:
        `,
            java: `class Solution {
    public boolean isPalindrome(int x) {
        
    }
}`,
            cpp: `class Solution {
public:
    bool isPalindrome(int x) {
        
    }
};`
        },
        functionName: 'isPalindrome',
        testCases: [
            { input: [121], expected: true },
            { input: [-121], expected: false },
            { input: [10], expected: false },
            { input: [0], expected: true },
            { input: [12321], expected: true }
        ]
    },
    {
        id: 'valid-parentheses',
        title: '20. Valid Parentheses',
        difficulty: 'Easy',
        tags: ['String', 'Stack'],
        description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        examples: [
            { input: 's = "()"', output: 'true' },
            { input: 's = "()[]{}"', output: 'true' },
            { input: 's = "(]"', output: 'false' }
        ],
        constraints: [
            '1 <= s.length <= 10^4',
            's consists of parentheses only \'()[]{}\'.'
        ],
        hints: [
            'Use a stack data structure.',
            'Push opening brackets onto the stack and pop when you see a matching closing bracket.'
        ],
        starterCode: {
            javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    
};`,
            python: `class Solution:
    def isValid(self, s: str) -> bool:
        `,
            java: `class Solution {
    public boolean isValid(String s) {
        
    }
}`,
            cpp: `class Solution {
public:
    bool isValid(string s) {
        
    }
};`
        },
        functionName: 'isValid',
        testCases: [
            { input: ["()"], expected: true },
            { input: ["()[]{}"], expected: true },
            { input: ["(]"], expected: false },
            { input: ["([)]"], expected: false },
            { input: ["{[]}"], expected: true }
        ]
    },
    {
        id: 'merge-two-sorted-lists',
        title: '21. Merge Two Sorted Lists',
        difficulty: 'Easy',
        tags: ['Linked List', 'Recursion'],
        description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
        examples: [
            { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' },
            { input: 'list1 = [], list2 = []', output: '[]' },
            { input: 'list1 = [], list2 = [0]', output: '[0]' }
        ],
        constraints: [
            'The number of nodes in both lists is in the range [0, 50].',
            '-100 <= Node.val <= 100',
            'Both list1 and list2 are sorted in non-decreasing order.'
        ],
        hints: [
            'You can solve this iteratively or recursively.',
            'Use a dummy head to simplify the merge process.'
        ],
        starterCode: {
            javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function(list1, list2) {
    
};`,
            python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        `,
            java: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        
    }
}`,
            cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        
    }
};`
        },
        functionName: 'mergeTwoLists',
        testCases: [
            { input: [[[1, 2, 4], [1, 3, 4]]], expected: [1, 1, 2, 3, 4, 4] }
        ],
        note: 'Linked list problems require special handling for test cases.'
    },
    {
        id: 'best-time-to-buy-and-sell-stock',
        title: '121. Best Time to Buy and Sell Stock',
        difficulty: 'Easy',
        tags: ['Array', 'Dynamic Programming'],
        description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
        examples: [
            { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
            { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'In this case, no transactions are done and the max profit = 0.' }
        ],
        constraints: [
            '1 <= prices.length <= 10^5',
            '0 <= prices[i] <= 10^4'
        ],
        hints: [
            'Keep track of the minimum price seen so far.',
            'Calculate the potential profit at each step.'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    
};`,
            python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        `,
            java: `class Solution {
    public int maxProfit(int[] prices) {
        
    }
}`,
            cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        
    }
};`
        },
        functionName: 'maxProfit',
        testCases: [
            { input: [[7, 1, 5, 3, 6, 4]], expected: 5 },
            { input: [[7, 6, 4, 3, 1]], expected: 0 },
            { input: [[1, 2]], expected: 1 },
            { input: [[2, 4, 1]], expected: 2 }
        ]
    },
    {
        id: 'contains-duplicate',
        title: '217. Contains Duplicate',
        difficulty: 'Easy',
        tags: ['Array', 'Hash Table', 'Sorting'],
        description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
        examples: [
            { input: 'nums = [1,2,3,1]', output: 'true' },
            { input: 'nums = [1,2,3,4]', output: 'false' },
            { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true' }
        ],
        constraints: [
            '1 <= nums.length <= 10^5',
            '-10^9 <= nums[i] <= 10^9'
        ],
        hints: [
            'Use a hash set to track seen numbers.',
            'Alternatively, sort the array and check adjacent elements.'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    
};`,
            python: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        `,
            java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        
    }
}`,
            cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        
    }
};`
        },
        functionName: 'containsDuplicate',
        testCases: [
            { input: [[1, 2, 3, 1]], expected: true },
            { input: [[1, 2, 3, 4]], expected: false },
            { input: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true }
        ]
    },
    {
        id: 'maximum-subarray',
        title: '53. Maximum Subarray',
        difficulty: 'Medium',
        tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
        description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
        examples: [
            { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
            { input: 'nums = [1]', output: '1', explanation: 'The subarray [1] has the largest sum 1.' },
            { input: 'nums = [5,4,-1,7,8]', output: '23', explanation: 'The subarray [5,4,-1,7,8] has the largest sum 23.' }
        ],
        constraints: [
            '1 <= nums.length <= 10^5',
            '-10^4 <= nums[i] <= 10^4'
        ],
        hints: [
            'Use Kadane\'s algorithm.',
            'Keep track of the maximum sum ending at each position.'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    
};`,
            python: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        `,
            java: `class Solution {
    public int maxSubArray(int[] nums) {
        
    }
}`,
            cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        
    }
};`
        },
        functionName: 'maxSubArray',
        testCases: [
            { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
            { input: [[1]], expected: 1 },
            { input: [[5, 4, -1, 7, 8]], expected: 23 }
        ]
    },
    {
        id: 'product-of-array-except-self',
        title: '238. Product of Array Except Self',
        difficulty: 'Medium',
        tags: ['Array', 'Prefix Sum'],
        description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.

You must write an algorithm that runs in O(n) time and without using the division operation.`,
        examples: [
            { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
            { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' }
        ],
        constraints: [
            '2 <= nums.length <= 10^5',
            '-30 <= nums[i] <= 30',
            'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.'
        ],
        hints: [
            'Use prefix and suffix products.',
            'Can you solve it with O(1) extra space?'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var productExceptSelf = function(nums) {
    
};`,
            python: `class Solution:
    def productExceptSelf(self, nums: list[int]) -> list[int]:
        `,
            java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        
    }
}`,
            cpp: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        
    }
};`
        },
        functionName: 'productExceptSelf',
        testCases: [
            { input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
            { input: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] }
        ]
    },
    {
        id: '3sum',
        title: '15. 3Sum',
        difficulty: 'Medium',
        tags: ['Array', 'Sorting', 'Two Pointers'],
        description: `Given an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
        examples: [
            { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0. nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0. nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0. The distinct triplets are [-1,0,1] and [-1,-1,2].' },
            { input: 'nums = [0,1,1]', output: '[]', explanation: 'The only possible triplet does not sum up to 0.' },
            { input: 'nums = [0,0,0]', output: '[[0,0,0]]', explanation: 'The only possible triplet sums up to 0.' }
        ],
        constraints: [
            '3 <= nums.length <= 3000',
            '-10^5 <= nums[i] <= 10^5'
        ],
        hints: [
            'Sort the array first.',
            'Use two pointers approach for each element.'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    
};`,
            python: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        `,
            java: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        
    }
}`,
            cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        
    }
};`
        },
        functionName: 'threeSum',
        testCases: [
            { input: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
            { input: [[0, 1, 1]], expected: [] },
            { input: [[0, 0, 0]], expected: [[0, 0, 0]] }
        ]
    },
    {
        id: 'longest-substring-without-repeating-characters',
        title: '3. Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        tags: ['Hash Table', 'String', 'Sliding Window'],
        description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
        examples: [
            { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
            { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
            { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3. Notice that the answer must be a substring, "pwke" is a subsequence not a substring.' }
        ],
        constraints: [
            '0 <= s.length <= 5 * 10^4',
            's consists of English letters, digits, symbols and spaces.'
        ],
        hints: [
            'Use a sliding window approach.',
            'Use a hash set to track characters in current window.'
        ],
        starterCode: {
            javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    
};`,
            python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        `,
            java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        
    }
}`,
            cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        
    }
};`
        },
        functionName: 'lengthOfLongestSubstring',
        testCases: [
            { input: ["abcabcbb"], expected: 3 },
            { input: ["bbbbb"], expected: 1 },
            { input: ["pwwkew"], expected: 3 },
            { input: [""], expected: 0 }
        ]
    },
    {
        id: 'reverse-string',
        title: '344. Reverse String',
        difficulty: 'Easy',
        tags: ['Two Pointers', 'String'],
        description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array **in-place** with O(1) extra memory.`,
        examples: [
            { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
            { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' }
        ],
        constraints: [
            '1 <= s.length <= 10^5',
            's[i] is a printable ascii character.'
        ],
        hints: [
            'Use two pointers, one from start and one from end.',
            'Swap characters until pointers meet.'
        ],
        starterCode: {
            javascript: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
var reverseString = function(s) {
    
};`,
            python: `class Solution:
    def reverseString(self, s: list[str]) -> None:
        """
        Do not return anything, modify s in-place instead.
        """
        `,
            java: `class Solution {
    public void reverseString(char[] s) {
        
    }
}`,
            cpp: `class Solution {
public:
    void reverseString(vector<char>& s) {
        
    }
};`
        },
        functionName: 'reverseString',
        testCases: [
            { input: [["h", "e", "l", "l", "o"]], expected: ["o", "l", "l", "e", "h"] },
            { input: [["H", "a", "n", "n", "a", "h"]], expected: ["h", "a", "n", "n", "a", "H"] }
        ]
    },
    {
        id: 'climbing-stairs',
        title: '70. Climbing Stairs',
        difficulty: 'Easy',
        tags: ['Math', 'Dynamic Programming', 'Memoization'],
        description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
        examples: [
            { input: 'n = 2', output: '2', explanation: 'There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps' },
            { input: 'n = 3', output: '3', explanation: 'There are three ways to climb to the top.\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step' }
        ],
        constraints: [
            '1 <= n <= 45'
        ],
        hints: [
            'This is essentially the Fibonacci sequence.',
            'Use dynamic programming to avoid recalculating.'
        ],
        starterCode: {
            javascript: `/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    
};`,
            python: `class Solution:
    def climbStairs(self, n: int) -> int:
        `,
            java: `class Solution {
    public int climbStairs(int n) {
        
    }
}`,
            cpp: `class Solution {
public:
    int climbStairs(int n) {
        
    }
};`
        },
        functionName: 'climbStairs',
        testCases: [
            { input: [2], expected: 2 },
            { input: [3], expected: 3 },
            { input: [5], expected: 8 },
            { input: [1], expected: 1 }
        ]
    },
    {
        id: 'binary-search',
        title: '704. Binary Search',
        difficulty: 'Easy',
        tags: ['Array', 'Binary Search'],
        description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with O(log n) runtime complexity.`,
        examples: [
            { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4' },
            { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1' }
        ],
        constraints: [
            '1 <= nums.length <= 10^4',
            '-10^4 < nums[i], target < 10^4',
            'All the integers in nums are unique.',
            'nums is sorted in ascending order.'
        ],
        hints: [
            'Use two pointers for the search range.',
            'Compare middle element with target to narrow down.'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
    
};`,
            python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        `,
            java: `class Solution {
    public int search(int[] nums, int target) {
        
    }
}`,
            cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        
    }
};`
        },
        functionName: 'search',
        testCases: [
            { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
            { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
            { input: [[5], 5], expected: 0 }
        ]
    },
    {
        id: 'flood-fill',
        title: '733. Flood Fill',
        difficulty: 'Easy',
        tags: ['Array', 'DFS', 'BFS', 'Matrix'],
        description: `An image is represented by an m x n integer grid \`image\` where \`image[i][j]\` represents the pixel value of the image.

You are also given three integers sr, sc, and color. You should perform a flood fill on the image starting from the pixel \`image[sr][sc]\`.

To perform a flood fill, consider the starting pixel, plus any pixels connected 4-directionally to the starting pixel of the same color as the starting pixel, plus any pixels connected 4-directionally to those pixels (also with the same color), and so on. Replace the color of all of the aforementioned pixels with color.

Return the modified image after performing the flood fill.`,
        examples: [
            { input: 'image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2', output: '[[2,2,2],[2,2,0],[2,0,1]]', explanation: 'From the center of the image with position (sr, sc) = (1, 1) (i.e., the red pixel), all pixels connected by a path of the same color as the starting pixel (i.e., the blue pixels) are colored with the new color.' },
            { input: 'image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, color = 0', output: '[[0,0,0],[0,0,0]]', explanation: 'The starting pixel is already colored 0, so no changes are made to the image.' }
        ],
        constraints: [
            'm == image.length',
            'n == image[i].length',
            '1 <= m, n <= 50',
            '0 <= image[i][j], color < 2^16',
            '0 <= sr < m',
            '0 <= sc < n'
        ],
        hints: [
            'Use DFS or BFS to traverse the connected region.',
            'Be careful not to recurse infinitely when the new color is same as old.'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[][]} image
 * @param {number} sr
 * @param {number} sc
 * @param {number} color
 * @return {number[][]}
 */
var floodFill = function(image, sr, sc, color) {
    
};`,
            python: `class Solution:
    def floodFill(self, image: list[list[int]], sr: int, sc: int, color: int) -> list[list[int]]:
        `,
            java: `class Solution {
    public int[][] floodFill(int[][] image, int sr, int sc, int color) {
        
    }
}`,
            cpp: `class Solution {
public:
    vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int color) {
        
    }
};`
        },
        functionName: 'floodFill',
        testCases: [
            { input: [[[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2], expected: [[2, 2, 2], [2, 2, 0], [2, 0, 1]] },
            { input: [[[0, 0, 0], [0, 0, 0]], 0, 0, 0], expected: [[0, 0, 0], [0, 0, 0]] }
        ]
    },
    {
        id: 'merge-intervals',
        title: '56. Merge Intervals',
        difficulty: 'Medium',
        tags: ['Array', 'Sorting'],
        description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
        examples: [
            { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].' },
            { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Intervals [1,4] and [4,5] are considered overlapping.' }
        ],
        constraints: [
            '1 <= intervals.length <= 10^4',
            'intervals[i].length == 2',
            '0 <= starti <= endi <= 10^4'
        ],
        hints: [
            'Sort intervals by start time.',
            'Compare each interval with the last merged interval.'
        ],
        starterCode: {
            javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {
    
};`,
            python: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        `,
            java: `class Solution {
    public int[][] merge(int[][] intervals) {
        
    }
}`,
            cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        
    }
};`
        },
        functionName: 'merge',
        testCases: [
            { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
            { input: [[[1, 4], [4, 5]]], expected: [[1, 5]] }
        ]
    }
];
