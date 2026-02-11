export const PROBLEMS = [
    {
        id: 'two-sum',
        title: '1. Two Sum',
        difficulty: 'Easy',
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
        examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
            { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
        ],
        starterCode: {
            javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`,
            python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        `,
            java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
            c: `/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n}`
        },
        testRunner: {
            javascript: (userCode) => {
                const tests = [
                    { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
                    { nums: [3, 2, 4], target: 6, expected: [1, 2] },
                    { nums: [3, 3], target: 6, expected: [0, 1] }
                ];

                // Wrap user code to return the function
                const func = new Function(`
                    ${userCode}
                    return twoSum;
                `)();

                return tests.map((test, i) => {
                    try {
                        const result = func(test.nums, test.target);
                        // Basic array equality check
                        const passed = Array.isArray(result) &&
                            result.length === 2 &&
                            result.sort((a, b) => a - b).every((val, index) => val === test.expected.sort((a, b) => a - b)[index]);
                        return {
                            passed,
                            input: `nums=[${test.nums}], target=${test.target}`,
                            expected: `[${test.expected}]`,
                            actual: `[${result}]`
                        };
                    } catch (e) {
                        return { passed: false, input: `Test ${i + 1}`, error: e.message };
                    }
                });
            }
        }
    },
    {
        id: 'palindrome-number',
        title: '9. Palindrome Number',
        difficulty: 'Easy',
        description: `Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise.`,
        examples: [
            { input: 'x = 121', output: 'true', explanation: '121 reads as 121 from left to right and from right to left.' },
            { input: 'x = -121', output: 'false', explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.' }
        ],
        starterCode: {
            javascript: `/**\n * @param {number} x\n * @return {boolean}\n */\nvar isPalindrome = function(x) {\n    \n};`,
            python: `class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        `,
            java: `class Solution {\n    public boolean isPalindrome(int x) {\n        \n    }\n}`,
            c: `bool isPalindrome(int x) {\n    \n}`
        },
        testRunner: {
            javascript: (userCode) => {
                const tests = [
                    { x: 121, expected: true },
                    { x: -121, expected: false },
                    { x: 10, expected: false }
                ];

                const func = new Function(`
                    ${userCode}
                    return isPalindrome;
                `)();

                return tests.map((test, i) => {
                    try {
                        const result = func(test.x);
                        return {
                            passed: result === test.expected,
                            input: `x=${test.x}`,
                            expected: String(test.expected),
                            actual: String(result)
                        };
                    } catch (e) {
                        return { passed: false, input: `Test ${i + 1}`, error: e.message };
                    }
                });
            }
        }
    },
    {
        id: 'valid-parentheses',
        title: '20. Valid Parentheses',
        difficulty: 'Easy',
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
        starterCode: {
            javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};`,
            python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        `,
            java: `class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}`,
            c: `bool isValid(char * s){\n    \n}`
        },
        testRunner: {
            javascript: (userCode) => {
                const tests = [
                    { s: "()", expected: true },
                    { s: "()[]{}", expected: true },
                    { s: "(]", expected: false },
                    { s: "([)]", expected: false },
                    { s: "{[]}", expected: true }
                ];

                const func = new Function(`
                    ${userCode}
                    return isValid;
                `)();

                return tests.map((test, i) => {
                    try {
                        const result = func(test.s);
                        return {
                            passed: result === test.expected,
                            input: `s="${test.s}"`,
                            expected: String(test.expected),
                            actual: String(result)
                        };
                    } catch (e) {
                        return { passed: false, input: `Test ${i + 1}`, error: e.message };
                    }
                });
            }
        }
    },
    {
        id: 'merge-two-sorted-lists',
        title: '21. Merge Two Sorted Lists',
        difficulty: 'Easy',
        description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
        examples: [
            { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' },
            { input: 'list1 = [], list2 = []', output: '[]' }
        ],
        starterCode: {
            javascript: `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} list1\n * @param {ListNode} list2\n * @return {ListNode}\n */\nvar mergeTwoLists = function(list1, list2) {\n    \n};`,
            python: `class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        `,
            java: `class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        \n    }\n}`,
            c: `/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     struct ListNode *next;\n * };\n */\nstruct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {\n    \n}`
        },
        testRunner: {
            javascript: (userCode) => {
                // Helper to creating linked list from array
                const createList = (arr) => {
                    if (!arr.length) return null;
                    let head = { val: arr[0], next: null };
                    let current = head;
                    for (let i = 1; i < arr.length; i++) {
                        current.next = { val: arr[i], next: null };
                        current = current.next;
                    }
                    return head;
                };
                // Helper to array from list
                const toArray = (head) => {
                    const res = [];
                    while (head) {
                        res.push(head.val);
                        head = head.next;
                    }
                    return res;
                };

                const tests = [
                    { l1: [1, 2, 4], l2: [1, 3, 4], expected: [1, 1, 2, 3, 4, 4] },
                    { l1: [], l2: [], expected: [] },
                    { l1: [], l2: [0], expected: [0] }
                ];

                const wrappedCode = `
                    function ListNode(val, next) {
                        this.val = (val===undefined ? 0 : val)
                        this.next = (next===undefined ? null : next)
                    }
                    ${userCode}
                    return mergeTwoLists;
                `;

                const func = new Function(wrappedCode)();

                return tests.map((test, i) => {
                    try {
                        const l1 = createList(test.l1);
                        const l2 = createList(test.l2);
                        const resultHead = func(l1, l2);
                        const resultArray = toArray(resultHead);

                        // Compare arrays
                        const passed = JSON.stringify(resultArray) === JSON.stringify(test.expected);

                        return {
                            passed,
                            input: `l1=[${test.l1}], l2=[${test.l2}]`,
                            expected: `[${test.expected}]`,
                            actual: `[${resultArray}]`
                        };
                    } catch (e) {
                        return { passed: false, input: `Test ${i + 1}`, error: e.message };
                    }
                });
            }
        }
    },
    {
        id: 'best-time-to-buy-and-sell-stock',
        title: '121. Best Time to Buy and Sell Stock',
        difficulty: 'Easy',
        description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
        examples: [
            { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
            { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'In this case, no transactions are done and the max profit = 0.' }
        ],
        starterCode: {
            javascript: `/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};`,
            python: `class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        `,
            java: `class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}`,
            c: `int maxProfit(int* prices, int pricesSize) {\n    \n}`
        },
        testRunner: {
            javascript: (userCode) => {
                const tests = [
                    { prices: [7, 1, 5, 3, 6, 4], expected: 5 },
                    { prices: [7, 6, 4, 3, 1], expected: 0 }
                ];

                const func = new Function(`
                    ${userCode}
                    return maxProfit;
                `)();

                return tests.map((test, i) => {
                    try {
                        const result = func(test.prices);
                        return {
                            passed: result === test.expected,
                            input: `prices=[${test.prices}]`,
                            expected: String(test.expected),
                            actual: String(result)
                        };
                    } catch (e) {
                        return { passed: false, input: `Test ${i + 1}`, error: e.message };
                    }
                });
            }
        }
    },
    {
        id: 'reverse-string',
        title: '344. Reverse String',
        difficulty: 'Easy',
        description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array **in-place** with O(1) extra memory.`,
        examples: [
            { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
            { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' }
        ],
        starterCode: {
            javascript: `/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nvar reverseString = function(s) {\n    \n};`,
            python: `class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        """\n        Do not return anything, modify s in-place instead.\n        """\n        `,
            java: `class Solution {\n    public void reverseString(char[] s) {\n        \n    }\n}`,
            c: `void reverseString(char* s, int sSize) {\n    \n}`
        },
        testRunner: {
            javascript: (userCode) => {
                const tests = [
                    { s: ["h", "e", "l", "l", "o"], expected: ["o", "l", "l", "e", "h"] },
                    { s: ["H", "a", "n", "n", "a", "h"], expected: ["h", "a", "n", "n", "a", "H"] }
                ];

                const func = new Function(`
                    ${userCode}
                    return reverseString;
                `)();

                return tests.map((test, i) => {
                    try {
                        // clone input to verify in-place mod
                        let input = [...test.s];
                        func(input);

                        const passed = JSON.stringify(input) === JSON.stringify(test.expected);
                        return {
                            passed,
                            input: `s=[${test.s}]`,
                            expected: `[${test.expected}]`,
                            actual: `[${input}]`
                        };
                    } catch (e) {
                        return { passed: false, input: `Test ${i + 1}`, error: e.message };
                    }
                });
            }
        }
    },
    {
        id: 'climbing-stairs',
        title: '70. Climbing Stairs',
        difficulty: 'Easy',
        description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
        examples: [
            { input: 'n = 2', output: '2', explanation: 'There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps' },
            { input: 'n = 3', output: '3', explanation: 'There are three ways to climb to the top.\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step' }
        ],
        starterCode: {
            javascript: `/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};`,
            python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        `,
            java: `class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}`,
            c: `int climbStairs(int n) {\n    \n}`
        },
        testRunner: {
            javascript: (userCode) => {
                const tests = [
                    { n: 2, expected: 2 },
                    { n: 3, expected: 3 },
                    { n: 5, expected: 8 }
                ];

                const func = new Function(`
                    ${userCode}
                    return climbStairs;
                `)();

                return tests.map((test, i) => {
                    try {
                        const result = func(test.n);
                        return {
                            passed: result === test.expected,
                            input: `n=${test.n}`,
                            expected: String(test.expected),
                            actual: String(result)
                        };
                    } catch (e) {
                        return { passed: false, input: `Test ${i + 1}`, error: e.message };
                    }
                });
            }
        }
    }
];
