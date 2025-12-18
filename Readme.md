# 🧠 Technical Knowledge Base

This repository is my second brain, optimized for **Full Stack Development** and **AI-driven retrieval**.

---

## 📂 Folder Structure
* `00_Inbox/`: Raw captures and temporary thoughts.
* `01_Projects/`: Active development tasks and sprints.
* `02_Areas/`: Long-term tech stacks (Frontend, Backend, DevOps).
* `03_Resources/`: General references and design patterns.
* `05_Assets/`: Centralized storage for images and diagrams.


---

## 🚀 Quick Setup
To activate the automated commit rules, templates, and aliases, run the setup script corresponding to your OS:

**macOS / Linux:**
```bash
chmod +x setup/linux_macos_setup.sh && ./setup\linux_macos_setup.sh
```
**window:**
```bash
setup\windows_setup.bat
```

---


## 🛠 Note-Taking Rules

To ensure high-quality "Smart Connections" and efficient search, all notes must adhere to these standards:

1. Structural Integrity
    * **Single H1:** Every note must have exactly one `# Title` at the top.
    * **Hierarchical Headings:** Use `##` for main sections and `###` for sub-sections. Never skip levels (e.g., don't go from `#` to `###`).
    * **Blank Lines:** Always leave a blank line before and after headings, lists, and code blocks to ensure the AI parser identifies boundaries correctly.

2. Semantic Richness
    * **Frontmatter:** Include a YAML block at the top for metadata:
        ```yaml
        ---
        tags: [tech-stack, specific-library, concept]
        status: active | permanent | archive
        last_refined: yyyy-mm-dd
        ---
        ```
    * **Contextual Linking:** Use `[[Note Name]]` to create hard links. When a concept is mentioned but not explained, link it to its dedicated note.
        
        **Example:**
        ```diff
        - React hooks are useful for state management.
        + [[React Hooks]] enable functional components to manage state without class syntax.
        ```
        This creates bidirectional links to dedicated notes, enabling AI to traverse related concepts and improve knowledge retrieval across your knowledge base.
    * **Declarative Language:** Use short, direct sentences. Avoid vague pronouns like "it" or "this" when referring to complex code logic.
        ```typescript
        const processData = (items) => {
        ❌    // It Transform each item by applying business logic normalization
        ✅    // Transform each item by applying business logic normalization
            return items.map(item => transform(item));
        };
        ```

3. Code Documentation
    * **Language Tags:** Always specify the language in code blocks (e.g., ` ```typescript `).
    * **Self-Contained Snippets:** Ensure code snippets include enough context (imports or variable definitions) so the AI can analyze them without opening five other files.
    * **Annotation:** Use inline comments to explain "Why" a specific logic was used, not just "What" the code does.

---

## ⚙️ Git Conventions

### 1. Commit Message Rules
We follow a strict **lowercase-only** convention enforced by local Git hooks.

| Prefix | Use Case |
| :--- | :--- |
| `note:` | Adding new technical content or notes. |
| `docs:` | Updates to README, metadata, or repository structure. |
| `fix:` | Correcting typos, broken links, or formatting errors. |
| `refactor:` | Reorganizing folders or splitting large notes. |
| `asset:` | Adding images, diagrams, or attachments. |
| `chore:` | Maintenance (IDE config, `.gitignore` updates). |

**Format:** `<type>: <lowercase_summary>`
*Example:* `note: add deep dive on react server components`

### 2. Branch Naming
Use these prefixes for organized "learning sprints" or maintenance:

* `draft/`: For incomplete or in-progress notes.
* `research/`: For raw data gathering before final organization.
* `fix/`: For repository cleanup or formatting tasks.
* `meta/`: For changes to the setup or repo configuration.

### 3. Custom Git Aliases
The setup script registers these shorthands for faster workflow:
* `git note`: View only your technical content updates (filters log by `note:`).
* `git today`: See everything you learned/noted in the last 24 hours.
* `git sync`: Quick shorthand for `git push`.
