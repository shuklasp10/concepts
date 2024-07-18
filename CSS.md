# Web developement Notes: CSS

## Table of Contents
- [Boilerplate](#Boilerplate)


## Boilerplate
- set margin and padding 0 for all elements for consistency
- set element size = border + padding + content (doesn't include margin)
- set body to fill screen
```
html, body {
    height: 100%;
    width: 100%
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
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

## tips for css
### from fireship video
1. __Learn box model__ including content, padding, border, margin
2. use clamp instead of media query
3. use aspect ration property for image and video `ascpect-ratio: 16/9`
4. use variables for global values like color, font sizes
__defining variables__
```
#root {
    --varName: value;
}
```
__using css variables__
```
div {
    color: var(--varName)
}
```
5. use calc to calculate different units
6. use focus within for dropdown menu

## turn of text selection
`user-select: none`

## hide scrollbar
```
&::-webkit-scrollbar {
    display: none;
  }
```

## mediaquery breakpoints
```
//mobile screen
@media screen and (max-width: 768px){}

// tablet
@media screen and (min-width: 769px) and (max-width: 1024px) {}

// desktop
@media screen and (min-width: 1024px) {}
```

##