# 🧠 Technical Knowledge Base

---

## 📂 Folder Structure
* `00_Inbox/`: Raw captures and temporary thoughts.
* `01_Projects/`: Active development tasks and sprints.
* `02_Areas/`: Long-term tech stacks (Frontend, Backend, DevOps).
* `03_Resources/`: General references and design patterns.
* `05_Assets/`: Centralized storage for images and diagrams.

This repository is my second brain, optimized for **Full Stack Development** and **AI-driven retrieval**.

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

