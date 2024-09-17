# Web developement Notes: CSS

## Table of Contents
- [Boilerplate](#boilerplate)
- [Background](#Background)
- [Border](#border)
- [Input](#input)
- [Lists](#lists)
- [Display](#display)
- [Position](#position)
- [Text and Fonts](#text-and-fonts)
- [Images](#images)
- [Grid](#grid)
- [Flex](#flex)
- [Scrollbar](#scrollbar)
- [Mediaquery](#mediaquery)
- [Conic Gradient](#conic-gradient)
- [Tips](#tips)


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

## Background
### remove bg
`background-color: transparent`
### opacity
add extra value in rgba  
`background-color: rgba(147, 150, 152, 0.7)`;
transparent (0)---------(1) opaque

<!-- Pending: add all display properties -->

## Border
* shadow: `box-shadow: 5px 10px 8px rgba(0, 0, 0, 0.3);`

## Input

## Lists

## Display
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

## Postion

## Text and Fonts
* Restrict text selection `user-select: none`

## Images

## Grid
* used for 2 dimensional control

### container properties
| property | value | description |
|----------|--------|-------------|
| `display` | `grid` | convert container in grid and children in block |
| `grid-template-columns` | `12px 12px auto or 1fr 3fr or repeat(3, 100px); or 10% 20% auto` | define columns |
| `grid-template-rows` | `12px 12px auto` | define rows |
| `gap` | `1rem` | short hand property for row and column |
| `justify-items` | `end or start or center or stretch (default)` | controls content inside grid horizontally |
| `align-items` | `end or start or center or stretch (default)` | controls content inside grid vertically |
| `align-content` | `end or start or center or space-around or space-between or space-evenly` | control whole grid as one vertically |
| `justify-content` | `end or start or center or space-around or space-between or space-evenly` | control whole grid as one horizontally |
| `grid-auto-flow` | `row or column or dense` | control which grid will be filled one by one |

### chilren properties

## Flex

## Scrollbar
* Scrollbar appears only when overflow is active and content is overflowed
### Overflow
* __`overflow-x`:__ target x axis scrollbar.
* __`overflow-y`:__ target y axis scrollbar.
* __`overflow:visible`:__ _(Default)_ content is not clipped and may be rendered outside the box
* __`overflow:hidden`:__ not able to scroll, content is clipped, scrollbar is not present
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

## Conic Gradient
* Used to create a circular gradient pattern around a center point.

![Conic gradient](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient/screenshot_2018-11-29_21.09.19.png)

### syntax
`background: conic-gradient(color end deg, color2 start deg...)`
* For first color deg will be its ending degree from 0
* from second color it will be starting deg and end of that color depend where next color starts
* If there is no next color it will end at 360 deg
* if there is difference in end of first color and start of second color, it will create gradient pattern

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

