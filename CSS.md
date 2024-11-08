# Web developement Notes: CSS

## Table of Contents

- [Selectors and combinator](#selectors-and-combinator)
- [Cascade and specificity](#cascade-and-specificity)
- [Inheritance](#inheritance)
- [Heigth and Width](#heigth-and-width)
- [Box model](#box-model)
- [Inline Elements](#inline-elements)
- [Units](#units)
- [Position](#position)
- [Transform](#transform)
- [Transition](#transition)
- [Box shadow and Text shadow](#box-shadow-and-text-shadow)
- [Background](#background)
- [Boilerplate](#boilerplate)
- [Background](#background)
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

## Heigth and Width

- __prevent overflow__ by using min, max or percentage instead of absolute pixel value

```[css]
div {
  min-width: 100px;
}
```

- width in percentage can be applied to child even parent width is not set. since by default width is 100%.
- height in precentage can not be applied to child if parent height is not set.
- `verticle-align` property is used to align two elements vertically

## Box model

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

## Inline Elements

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

## position

### static

- Default position property
- `top`, `bottom`, `left`, `right` property are locked

### relative

- Unlock `top`, `bottom`, `left`, `right` property.
- __attached__ to parent. moves with parent.
- can be moved outside parent.
- 0px means original position.
- Overlaps other element while moving unless next sibiling is also non-static. then it get overlap by that sibiling
- It moves with respective to its original position. `top: 10px` means it moves 10px down from original position
- `top: 10px` is same as `bottom: -10px` and vice versa
- if both `top` and `bottom` is given then only `top` is considered.
- if both `left` and `right` is given then only `right` is considered.
- `inset` property can be used to define all property
- `inset: 20px 30px` means `top: 20px; right: 30px; bottom: 20px; left: 30px;`

### absolute

- lift element in parent (static or non-static) box and space taken by sibilings.
- __attached__ to parent, moves with parent
- can be moved outside parent
- 0px means __non-static parent__ starting point.
- - Overlaps other element while moving unless next sibiling is also relative. then it get overlap by that sibiling
- It moves with respective to recently __non-static parent__. If no non-static parent found it moves with respective to viewport

### fixed

- lift element in parent (static or non-static) box and space taken by sibilings.
- __attached__ to parent, moves with parent.
- can be moved outside parent.
- 0px means viewport starting point always.
- Overlaps other element while moving unless next sibiling is also relative. then it get overlap by that sibiling
- if both `top` and `bottom` is given then element is stretched and leaving space from top and bottom by given value. (unless height is not specified)
- if both `left` and `right` is given then element is stretched and leaving space from top and bottom. (unless width is not specified)

### sticky

- Does not lift element
- __attached__ to parent, moves with parent.
- can't be moved outside parent.
- if `top:10px` then when parent is scrolled it makes 10px spaces from parent until whole parent is scrolled then it goes up with parent.
- it works with most recent parent which is scrollable if not found work with viewport.
- if top and bottom both given top is considered and it does not stretch element


## Transform

- transform is used to change transform element without affecting surrounding elemenets position.

### scale

- scale is used to increase size (zoom in) of element.
- `transform: scale(2.5)` size become 2.5 times original size.
- to change center of element from which size is increased
- `transform-origin: 0 0` it centre of transform will be top left corner.
- `transform-origin: 100% 100%` centre will bottom right corner.

### rotate

- used to rotate element
- `transform: rotate(90deg)` rotate element clockwise from center
- origin can be changed using `transform-origin` property

### translate

- used to move element from its original position
- `tranform: translate(20px 30px)` element moves 20px left and 30px down overlapping other elements.
- `translate` is shorthand property of `translateX` and `translateY`.
- `transform: translateX(50%)` moves element left by 30% of its width.
- while `top`, `bottom` properties moves element according to parent width and height, translate moves element according to elements width and height.
- to center a div

  ```[css]
  div {
    postion: absolute;
    top: 50%;
    bottom: 50%;
    transform: translate(-50%, -50%)
  }
  ```

## transition

- to control how property changes based on action like hover
- `transition: all 300ms` property will change in 200ms. More time more smooth transition.
- __value format:__ property selector and time.
- `transition: transform 300ms` to select only transform property to transition.

## box shadow and text shadow

### box-shadow

- `box-shadow: 10px 20px 5px rgb(0,0,20)`
- value format X Y blur radius and color
- `box-shadow: 10px 20px 5px 10px rgb(0,0,20)` it will add 10px in shadow height and width in all direction. also called __spread__

### text-shadow

- `text-shadow: 10px 20px 5px rgb(0,0,20)`
- same as box shadow but does not have spread
- can be inherited from parent since it's text property

## background

- `background-image: url('')` to set image as background
- `background-repeat: no-repeat` to prevent background repeating to cover element height and cover
- `background-size: cover` to  crop image to fit element
- `background-position-x` to set background position
- __remove background:__ `background-color: transparent`
- __opacity:__ `background-color: rgba(147, 150, 152, 0.7)` provide alpha value. transparent [0....1] opaque.

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
