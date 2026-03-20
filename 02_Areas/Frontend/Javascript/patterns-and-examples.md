# Patterns and Examples

## Example: submit input on key press event

```markup
<body>
  <input onKeyDown={addTag} />
  <script>
    const addTag = (e) =>{
      if( e.key == "enter" ){
        add tag...
      }
    }
  </script>
</body>
```

## Example: add chip in input fields

```plain
div = chip span + input (flexgrow : 1)
```
