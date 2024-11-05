# Web developement Notes: CSS

## Table of Contents

- [Selectors and combinator](#selectors-and-combinator)
- [Cascade and specificity](#cascade-and-specificity)
- [Boilerplate](#boilerplate)
- [Background](#background)
- [Border](#border)
- [Input](#input)
- [Lists](#lists)
- [Position](#position)
- [Text and Fonts](#text-and-fonts)
- [Images](#images)
- [Grid](#grid)
- [Flex](#flex)
- [Scrollbar](#scrollbar)
- [Mediaquery](#mediaquery)
- [Conic Gradient](#conic-gradient)
- [Tips](#tips)

## Selectors and combinator

### selectors

1. __element__  `p{ }, h1{ }`
2. __class__  `.class1{ }, .class2{ }`
3. __id__  `#id1{ }, #id2{ }`
4. __attribute__ `[type] { }` selects all element which have property type. for more specific `[type="text"] { }`

### combinator

- `div p` __children and grandchildren__ selects all `p` children or grandchildren of `div`
- `div > p` __only children__ selects `p` direct children of `div`
- `.test.demo` __and__ select all element with class name test and demo
- `.test, demo` __or__ select all element with class name test or demo
- `div + p` __next immediate__ selects `p` that comes immediatly after `div` no other element in between.
- `div ~ p` __next all__ selects all `p` in dom that comes after `div`

## Cascade and specificity

- If the same property is applied to an element multiple times with different values, here’s how the final value is decided in following order:
  1. __specificty__ The style with the highest specificity (more targeted selector) will apply.
  2. __cascade rule__ if two styles have the same specificity, the one that appears later in the CSS will apply.
- Specificty for selectors are
  - __element selectors__ 001
  - __class selectors__ 010
  - __attribute selectors__ 010
  - __id selectors__ 100
- for combinators all selectors specificity is added
  - `div p` has specificity 001+001 = 002
  - `div .class1` has specificity 001+010 = 011
  - `#id .class1 #id2` has specificity 100+010+100 = 210
  - `#id#id` has specificity 100+100 = 200
- inline css can be overridden by using `!important` in css file.

```[css]
li{
  color: green; !important
}
```

>Specificity: Element selector < Class selector < Id selector < Internal CSS < Inline CSS < important

## Inheritance

- some property inherit value from parent and some not
- like color property is inherited from parent
- button override parent property with its default property
- To manaully inherit parent property use vaue `inherit`

```[css]
button {
  color: inherit;
}
```

## heigth & width

- __prevent overflow__ by using min, max or percentage instead of absolute pixel value

```[css]
div {
  min-width: 100px;
}
```

- width in percentage can be applied to child even parent width is not set. since by default width is 100%.
- height in precentage can not be applied to child if parent height is not set.

## padding, border & margin

- border default color is same as color of text in it.
- `border` prooperty is combination of
  - `border-width`
  - `border-style`
  - `border-color`
- margin can be negative to move box opposite
- __box sizing___
  - By default `content-box`, height and width given to block is applied to content only.
  - to include padding and border set

  ```[css]
  div {
    box-sizing: border-box;
  }
  ```

- __margin collapse__ when starting margin of two vertically stacked element touch each other then their margin collapse into one. changing margin of one will change another. To prevent this
  - set outer element `padding-top: 1px`
  - set outer element `overflow: hidden`
- __outline__ is same as border but do not take space or change height and width.

## inline elements

- Following property does not apply
  - `height`
  - `width`
- `padding`, `border`& `margin` work all four side but does not push elements top and bottom instead it overlap it. Means it does not work vertically
- `display: block` can be used to change it to block.
- By default, block elements don't allow the next element to sit beside them.
- `inline-block` alows next element start right after current element like an inline element and use margin, padding, border like block element
- __replaced inline__ elements are inline elements but act as inline-block elements like `img`, `iframe`, `video`

## Units

### percentage

- `width` is calculated on parent width
- `height` is calculated on parent height only if parent height is defined
- `padding` & `margin` is calculated on parent width
- `border` does not work with percentage
- `font-size` is calculated on parent font-size.

### vw & vh

- `vw` viewport width calcuate percentage of browser width.
- `vh` viewport height calcuate percentage of browser height.

### em

- em (element) is mutiple of current `font-size`
- in starting `1em = 16px`
- if element has `font-size: 4px` then `2em = 8px`
- width, height, padding, margin can be set using em based on current font-size.
- if font-size is set in em then it will calculate based on parent font-size.

```[css]
.parent {
  font-size: 20px;
  width: 2em;   //40px
}
.inner {
  font-size: 1.5em;   //30px
  width: 2em;   //60px
}
```

### rem

- rem (root element) is multiple of root element (html).
- rem is fixed throughout document
- to change rem value root font-size should be changed

  ```[css]
  html {
    font-size: 10px;
  }
  div {
    font:size: 2rem   //20px
  }
  ```

- we can also select root as `:root {   }`

## postions

### static

- Default position property
- `top`, `bottom`, `left`, `right` property are locked

### relative

- Unlock `top`, `bottom`, `left`, `right` property
- It moves with respective to its original position. `top: 10px` means it moves 10px down from original position
- `top: 10px` is same as `bottom: -10px` and vice versa
- if both `top` and `bottom` is given then only `top` is considered.
- if both `left` and `right` is given then only `right` is considered.
- `inset` property can be used to define all property
- `inset: 20px 30px` means `top: 20px; right: 30px; bottom: 20px; left: 30px;`

### absolute

- it lift the element from its placed and its place is occupied by next element.
- It moves with respective to recently __non-static parent__. If no non-static parent found it moves with respective to viewport
- if both `top` and `bottom` is given then element is stretched and leaving space from top and bottom.
- if both `left` and `right` is given then element is stretched and leaving space from top and bottom.

### fixed

- Same as absolute but always moves with respect to viewport. doesn't matter what parent is

### sticky

## position

## Boilerplate

- set margin and padding 0 for all elements for consistency
- set element size = border + padding + content (doesn't include margin)
- set body to fill screen

```[css]
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

## background

### remove bg

`background-color: transparent`

### opacity

add extra value in rgba  
`background-color: rgba(147, 150, 152, 0.7)`;
transparent (0)---------(1) opaque

<!-- Pending: add all display properties -->

## Border

- shadow: `box-shadow: 5px 10px 8px rgba(0, 0, 0, 0.3);`

## Input

## Lists

## Postion

## Text and Fonts

- Restrict text selection `user-select: none`

## Images

## Grid

- used for 2 dimensional control

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

- Scrollbar appears only when overflow is active and content is overflowed

### Overflow

- __`overflow-x`:__ target x axis scrollbar.
- __`overflow-y`:__ target y axis scrollbar.
- __`overflow:visible`:__ _(Default)_ content is not clipped and may be rendered outside the box
- __`overflow:hidden`:__ not able to scroll, content is clipped, scrollbar is not present
- __`overflow:scroll`:__ scrollbar is added whether content overflow or not
- __`overflow:auto`:__ scrollbar is added only when content is overflowed.

### Structure

- __::-webkit-scrollbar:__ Targets the entire scrollbar.
- __::-webkit-scrollbar-thumb:__ Targets the draggable part (thumb).
- __::-webkit-scrollbar-track:__ Targets the background area of the scrollbar.
- __::-webkit-scrollbar-button:__ Targets the arrow buttons at the ends.
- __::-webkit-scrollbar-corner:__ Targets the corner where horizontal and vertical scrollbars meet.

### CSS example

```[css]
.container::-webkit-scrollbar {
  width: 12px; /* Width of vertical scrollbar */
  height: 12px; /* Height of horizontal scrollbar */
}
```

### SCSS example

```[css]
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

```[css]
&::-webkit-scrollbar {
    display: none;
  }
```

## Mediaquery

```[css]
//mobile screen
@media screen and (max-width: 768px){}

// tablet
@media screen and (min-width: 769px) and (max-width: 1024px) {}

// desktop
@media screen and (min-width: 1024px) {}
```

## Conic Gradient

- Used to create a circular gradient pattern around a center point.

![Conic gradient](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient/screenshot_2018-11-29_21.09.19.png)

### syntax

`background: conic-gradient(color end deg, color2 start deg...)`

- For first color deg will be its ending degree from 0
- from second color it will be starting deg and end of that color depend where next color starts
- If there is no next color it will end at 360 deg
- if there is difference in end of first color and start of second color, it will create gradient pattern

## Tips

### from fireship video

1. __Learn box model__ including content, padding, border, margin
2. use clamp instead of media query
3. use aspect ration property for image and video `ascpect-ratio: 16/9`
4. use variables for global values like color, font sizes
__defining variables__

    ```[css]
    #root {
        --varName: value;
    }
    ```

5. __using css variables__

    ```[css]
    div {
        color: var(--varName)
    }
    ```

6. use calc to calculate different units
7. use focus within for dropdown menu
