# Romanized English to Nepali Transliteration

## 1. Overview
The **Romanized to Nepali Transliteration Tool** instantly converts phonetic Romanized English typing (e.g. `"namaste"`, `"dhanyabaad"`, `"nepal"`) into standard Devanagari Unicode (`"नमस्ते"`, `"धन्यवाद"`, `"नेपाल"`).

---

## 2. Directory Structure
```
src/tools/nepali-romanized/
├── README.md           # Developer documentation
└── utils.ts            # Unicode mapping tables and transliteration tokenizer

src/app/tools/nepali-romanized/
└── page.tsx            # Live typing input, character map reference, and copy tools
```

---

## 3. Pure Logic & APIs (`utils.ts`)

### Key Functions
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `transliterateRomanToNepali(input)` | `string` | `string` | Scans input string using greedy token matching against Devanagari vowels, consonants, conjuncts, and matras. |

---

## 4. UI Implementation
* **Live Transliteration**: Transforms keystrokes into Devanagari in real-time.
* **Character Chart**: Includes a collapsible phonetic key reference for consonants (`ka` -> क, `kha` -> ख), vowels (`aa` -> आ, `ee` -> ई), and halanta/half-characters.
* **Copy & Word Count**: Single-click copy with character and word statistics.

---

## 5. How to Contribute / Extend
* Expand the ligature and conjunct dictionary in `utils.ts` for specialized Sanskrit/Nepali compound characters.
