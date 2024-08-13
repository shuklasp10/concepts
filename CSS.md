# Web developement Notes: CSS

## Table of Contents
- [Boilerplate](#Boilerplate)
- [Inline and Block elements](#inline-and-block-elements)
- [Background opacity](#background-opacity)
- [Border Shadow](#border-shadow)
- [Tips](#tips)
- [Text Selection](#text-selection)
- [Scrollbar](#scrollbar)
- [Mediaquery](#mediaquery)


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

## Inline and Block elements
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

## Background opacity
add extra value in rgba  
transparent (0)---------(1) opaque  
`background-color: rgba(147, 150, 152, 0.7)`;

## Border Shadow
`box-shadow: 5px 10px 8px rgba(0, 0, 0, 0.3);`

## Tips
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

## Text Selection
`user-select: none`

## Scrollbar
* Scrollbar appears only when overflow is active and content is overflowed
### Overflow
* __`overflow-x`:__ target x axis scrollbar.
* __`overflow-y`:__ target y axis scrollbar.
* __`overflow:visible`:__ _(Default)_ content is not clipped and may be rendered outside the box
* __`overflow:hidden`:__ content is clipped, scrollbar is not present, not able to scroll
* __`overflow:scroll`:__ scrollbar is added whether content overflow or not
* __`overflow:auto`:__ scrollbar is added only when content is overflowed.

### Structure
* __::-webkit-scrollbar:__ Targets the entire scrollbar.
* __::-webkit-scrollbar-thumb:__ Targets the draggable part (thumb).
* __::-webkit-scrollbar-track:__ Targets the background area of the scrollbar.
* __::-webkit-scrollbar-button:__ Targets the arrow buttons at the ends.
* __::-webkit-scrollbar-corner:__ Targets the corner where horizontal and vertical scrollbars meet.


### CSS example
```
.container::-webkit-scrollbar {
  width: 12px; /* Width of vertical scrollbar */
  height: 12px; /* Height of horizontal scrollbar */
}
```
### SCSS example
```
.scrollable-container {
  width: 300px;
  height: 200px;
  border: 1px solid #ccc;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 12px; /* Width of vertical scrollbar */
    height: 12px; /* Height of horizontal scrollbar */
  }
}
```

### hide scrollbar
```
&::-webkit-scrollbar {
    display: none;
  }
```

## Mediaquery
```
//mobile screen
@media screen and (max-width: 768px){}

// tablet
@media screen and (min-width: 769px) and (max-width: 1024px) {}

// desktop
@media screen and (min-width: 1024px) {}
```

##