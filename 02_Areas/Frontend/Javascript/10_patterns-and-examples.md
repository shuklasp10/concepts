# Patterns and Examples

## Example: submit input on key press event

```html
<body>
  <input id="tagInput" />
  <script>
    const addTag = (e) => {
      if (e.key === "Enter") {
        // add tag...
      }
    }
    document.getElementById('tagInput').addEventListener('keydown', addTag);
  </script>
</body>
```

## Example: add chip in input fields

```plain
div = chip span + input (flexgrow : 1)
```
