---
description: Build and query the graphify knowledge graph for the Elite Bloemen codebase
---

# graphify — knowledge graph of the codebase

graphify (`graphifyy` on PyPI) maps the project into a queryable knowledge graph.
Installed via `uv tool install graphifyy`. CLI lives at `C:\Users\Dushka\.local\bin`.

## PATH note (Windows / PowerShell)
The CLI dir is not on the default session PATH. Prefix every command with:
```powershell
$env:PATH = "C:\Users\Dushka\.local\bin;$env:PATH"
```

## Important: graph location
Root `.md` docs require an LLM API key, so the graph is built from CODE ONLY (`src`).
Output lives in `src\graphify-out\` (NOT root `graphify-out\`).
- Report: `src\graphify-out\GRAPH_REPORT.md`
- Graph:  `src\graphify-out\graph.json`
- Visual: `src\graphify-out\graph.html`

## Build / rebuild the graph (no API cost, AST-only)
```powershell
$env:PATH = "C:\Users\Dushka\.local\bin;$env:PATH"
graphify .\src
graphify cluster-only .\src --no-label
```

## Keep the graph fresh after editing code
```powershell
$env:PATH = "C:\Users\Dushka\.local\bin;$env:PATH"
graphify update .\src
```

## Query the graph instead of grepping files
```powershell
$env:PATH = "C:\Users\Dushka\.local\bin;$env:PATH"
graphify query "<question>" --graph .\src\graphify-out\graph.json
```
- `affected "X" --graph .\src\graphify-out\graph.json` — what breaks if X changes
- `--budget N` — cap output tokens (default 2000)

## Write to graph memory (decisions / bugs / outcomes)
The graph is the project memory. Persist Q&A, decisions and fixed bugs:
```powershell
$env:PATH = "C:\Users\Dushka\.local\bin;$env:PATH"
graphify save-result --question "<q>" --answer "<a>" --type query `
  --nodes "<symbol1>" "<symbol2>" --memory-dir .\src\graphify-out\memory
```
Memory files land in `src\graphify-out\memory\*.md` and survive across sessions.

## Agent rules (always)
- Before answering architecture / "where is X" / "what depends on Y" — query the graph first.
- After editing code in a session — run `graphify update .\src`.
- After resolving a decision, bug, or non-trivial Q&A — `graphify save-result` it.

## Limitation (report to user when it blocks)
The graph is CODE-ONLY (AST). It does NOT index `.md` docs and cannot store free-text
notes as semantic concepts WITHOUT an LLM API key. For semantic memory (doc files,
"why" rationale as concept nodes), set an API key and run full `graphify .` (paid).
If a question needs info that isn't in the code graph or saved memory, tell the user.

## Optional: richer semantic graph (costs API tokens)
Set an API key, then run full extraction including docs:
```powershell
$env:GEMINI_API_KEY = "<key>"   # or OPENAI_API_KEY / ANTHROPIC_API_KEY
graphify .
```
