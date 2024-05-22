# Web developement Notes: CSS

## Table of Contents
- [Boilerplate](#Boilerplate)


## Boilerplate
- set margin and padding 0 for all elements for consistency
- set element size = border + padding + content (doesn't include margin)
- set body to fill screen
```
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
    width: 100%
}
```

## inline vs block elements
### inline
1. Does not follow box model.
2. does not width & height, it's according to content
2. can set margin left and right but not top and bottom
4. Does not start in new line

### block
1. follow box model
2. have width and height
3. can set margin all direction
4. starts in new line and takes all width available.

## transparency in bg color
add extra value in rgba  
transparent (0)---------(1) opaque  
`background-color: rgba(147, 150, 152, 0.7)`;

## shadow on div
`box-shadow: 5px 10px 8px rgba(0, 0, 0, 0.3);`



