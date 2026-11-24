# DenOS text editor and C completion

The default editor remains a small VGA text-mode Vim-style editor. It does not start a window manager or GUI. C completion is implemented inside the editor and uses the current buffer; it does not require a language-server process or filesystem index.

## Completion

Open a `.c` or `.h` file with `edit file.c`. Enter insert mode with `i`, `a`, `A`, `I`, `o`, or `O`. When the cursor follows an identifier prefix of at least two characters, the editor offers:

- Aiden C/C keywords and common C type names.
- Built-ins implemented by the Aiden C VM, including console, string and ASCII character helpers.
- Identifiers found elsewhere in the current source file, including functions and local/global names.

The collector skips C line comments, block comments, string literals and character literals. It stores at most 24 suggestions, each bounded to 31 characters. Identifiers discovered in the current buffer are prioritized, followed by Aiden C VM built-ins, type aliases, and language keywords. Suggestions render in a floating, VS Code-inspired dropdown over the text area: the selected row is blue-highlighted, each entry has a compact kind icon, and its kind (`function`, `type`, `keyword`, or `symbol`) appears at the right. The list keeps the current selection visible while cycling.

| Key | Action |
|---|---|
| `Down` / `Ctrl-N` | Select the next suggestion |
| `Up` / `Ctrl-P` | Select the previous suggestion |
| `Tab` | Accept the highlighted item; function candidates add `()` |
| `Esc` | Dismiss the dropdown for the current prefix; press again to leave insert mode |
| `:set nocomplete` | Disable C suggestions |
| `:set complete` | Re-enable C suggestions |

When a function suggestion is accepted, `()` is inserted and the cursor is placed between the parentheses unless an opening parenthesis is already present. The text inserted by completion belongs to the current undo checkpoint.

Completion is lexical and buffer-local. It is not a full semantic C language server: it does not resolve types, overloads, scopes precisely, project headers, external declarations, argument signatures, or compiler diagnostics. The list may include an identifier used in an unrelated scope or omit a name that is not present in the current file.

## Editing keys

| Key | Action |
|---|---|
| `h/j/k/l` or arrows | Move |
| `w`, `b` | Move by identifier word |
| `0`, `$`, `gg`, `G` | Beginning/end of line or file |
| `i`, `a`, `I`, `A` | Insert at cursor, after cursor, first non-space or line end |
| `o`, `O` | Open a line below or above |
| `x`, `D`, `dd` | Delete character, to end of line, or whole line |
| `yy`, `p`, `P` | Yank and paste a line |
| `u`, `Ctrl-R` | Undo and redo the last edit checkpoint |
| `/pattern`, `?pattern`, `n`, `N` | Search forward/backward and repeat |
| `:w`, `:q`, `:q!`, `:wq`, `:x` | Save, quit, discard, save and quit |
| `:check` | Check delimiter, comment and literal balance |
| `:make`, `:compile` | Compile the current buffer as Aiden C and show compiler diagnostics |
| `:set number`, `:set nonumber` | Toggle line numbers |

`:make` and `:compile` compile the current buffer with the built-in Aiden C compiler and report the generated AEX image size or compiler diagnostic. The editor keeps its output image in static storage to avoid consuming the small kernel stack. Compilation does not execute the program. `:check` is a structural preflight only. It checks parentheses, brackets, braces, block comments, and quoted literals; it does not parse C grammar or replace `cc`.
