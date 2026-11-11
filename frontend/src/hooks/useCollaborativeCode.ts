import { useCallback, useEffect, useRef, useState } from 'react'

export interface RemoteCursor {
  name: string
  line: number
  column: number
  color: string
}

const STARTER: Record<string, string> = {
  javascript: `// Two Sum — collaborative DSA session
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
console.log(twoSum([2, 7, 11, 15], 9));`,
  typescript: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
console.log(greet('DevConnect'));`,
  python: `# Pair programming — Python
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []

print(two_sum([2, 7, 11, 15], 9))`,
  java: `class Solution {
  public int[] twoSum(int[] nums, int target) {
    java.util.Map<Integer, Integer> map = new java.util.HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int need = target - nums[i];
      if (map.containsKey(need)) return new int[] { map.get(need), i };
      map.put(nums[i], i);
    }
    return new int[0];
  }
}`,
  go: `package main

import "fmt"

func twoSum(nums []int, target int) []int {
  seen := map[int]int{}
  for i, n := range nums {
    if j, ok := seen[target-n]; ok {
      return []int{j, i}
    }
    seen[n] = i
  }
  return nil
}

func main() { fmt.Println(twoSum([]int{2, 7, 11, 15}, 9)) }`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
  // Collaborate on approach with your partner
  return {};
}`,
  rust: `fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    // Pair programming in Rust
    vec![]
}`,
}

const LANG_TO_MONACO: Record<string, string> = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Python: 'python',
  Java: 'java',
  Go: 'go',
  'C++': 'cpp',
  Rust: 'rust',
}

const CURSOR_COLORS = ['#818cf8', '#10b981', '#f59e0b', '#06b6d4']

export function useCollaborativeCode(sessionId: string, userName: string) {
  const [language, setLanguage] = useState('JavaScript')
  const [code, setCode] = useState(STARTER.javascript)
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([])
  const [connectedPeers, setConnectedPeers] = useState<string[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const myColor = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)])

  useEffect(() => {
    const key = `dc-pair-code-${sessionId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { code: string; language: string }
        setCode(parsed.code)
        setLanguage(parsed.language)
      } catch { /* ignore */ }
    }
  }, [sessionId])

  useEffect(() => {
    const bc = new BroadcastChannel(`dc-pair-${sessionId}`)
    channelRef.current = bc

    bc.onmessage = (event: MessageEvent) => {
      const data = event.data as {
        type: string
        code?: string
        language?: string
        from?: string
        line?: number
        column?: number
        color?: string
        peers?: string[]
      }
      if (data.type === 'code' && data.code != null && data.from !== userName) {
        setCode(data.code)
        setLastSaved(new Date())
      }
      if (data.type === 'cursor' && data.from && data.from !== userName) {
        setRemoteCursors((prev) => {
          const rest = prev.filter((c) => c.name !== data.from)
          return [...rest, {
            name: data.from!,
            line: data.line ?? 1,
            column: data.column ?? 1,
            color: data.color ?? '#818cf8',
          }]
        })
      }
      if (data.type === 'presence' && data.from && data.from !== userName) {
        setConnectedPeers((prev) => Array.from(new Set([...prev, data.from!])))
      }
    }

    bc.postMessage({ type: 'presence', from: userName, peers: [userName] })
    const ping = globalThis.setInterval(() => {
      bc.postMessage({ type: 'presence', from: userName })
    }, 5000)

    return () => {
      globalThis.clearInterval(ping)
      bc.close()
    }
  }, [sessionId, userName])

  const persist = useCallback((nextCode: string, nextLang: string) => {
    localStorage.setItem(`dc-pair-code-${sessionId}`, JSON.stringify({ code: nextCode, language: nextLang }))
    setLastSaved(new Date())
  }, [sessionId])

  const updateCode = useCallback((next: string) => {
    setCode(next)
    persist(next, language)
    channelRef.current?.postMessage({ type: 'code', code: next, from: userName })
  }, [language, persist, userName])

  const changeLanguage = useCallback((lang: string) => {
    setLanguage(lang)
    const monacoLang = LANG_TO_MONACO[lang] ?? 'javascript'
    const starter = STARTER[monacoLang] ?? STARTER.javascript
    setCode(starter)
    persist(starter, lang)
    channelRef.current?.postMessage({ type: 'code', code: starter, from: userName })
  }, [persist, userName])

  const reportCursor = useCallback((line: number, column: number) => {
    channelRef.current?.postMessage({
      type: 'cursor',
      from: userName,
      line,
      column,
      color: myColor.current,
    })
  }, [userName])

  return {
    language,
    code,
    remoteCursors,
    connectedPeers,
    lastSaved,
    monacoLanguage: LANG_TO_MONACO[language] ?? 'javascript',
    updateCode,
    changeLanguage,
    reportCursor,
    starterFor: (lang: string) => STARTER[LANG_TO_MONACO[lang] ?? 'javascript'] ?? STARTER.javascript,
  }
}

export { LANG_TO_MONACO, STARTER }
