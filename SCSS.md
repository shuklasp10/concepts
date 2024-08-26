# SCSS Notes

## Index
- [Introduction](#introduction)
- [Variables](#variables)
- [Nesting](#Nesting)
- [Mixins](#Mixins)
- [Extend or Inheritance](#extend-or-inheritance)
- [Operators](#operators)


## Introduction
* SCSS is preprocessor which provide fancy way of writing CSS.
* SCSS is compiled by SCSS library and converted to CSS
* It provide following features
    * __Variables:__ Store reusable values like colors and fonts.
    * __Nesting:__ Organize CSS selectors to mirror your HTML structure.
    * __Partials:__ Break down CSS into smaller, reusable files.
    * __Modules:__ Organize Sass into separate files with namespaces.
    * __Mixins:__ Create reusable blocks of CSS with optional arguments.
    * __Extend/Inheritance:__ Share styles between selectors.
Operators: Perform calculations within your CSS (e.g., for responsive layouts).

### Setting up with react
* Install SASS library as dev dependency
```
npm i sass --save-dev
```

## Variables
* Stores information to use in sheet further
* It can store any value of css property that can be used later
* Use `$` before property to make is variable
```
$primary-color: #333;
```
* When SCSS is compiled actual value of variable is placed anywhere it is used
* It is used to make consistency

## Nesting
* SCSS provides visual heirarchy just like HTML

```
//CSS
nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
nav li {
  display: inline-block;
}
nav a {
  display: block;
  padding: 6px 12px;
  text-decoration: none;
}

//SCSS
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li { display: inline-block; }

  a {
    display: block;
    padding: 6px 12px;
    text-decoration: none;
  }
}
```

## Partials
* Partials files are like snippets that can be used in actual sheet
* This helps to make css modularize
* Partials file name start with `_` like `_partials.scss`
```
//_partials
$font-stack: Helvetica, sans-serif;
$primary-color: #333;

body {
  font: 100% $font-stack;
  color: $primary-color;
}

//styles.scss
@use 'base';

.inverse {
  background-color: base.$primary-color;
  color: white;
}
```

## Mixins
* Mixins are like functions which may accept variable (also have default value) and generate css based using that variable value
```
@mixin theme($theme: DarkGray) {
  background: $theme;
  box-shadow: 0 0 1px rgba($theme, .25);
  color: #fff;
}

//here default value is used
.info {
  @include theme;
}

//here passed value is used
.alert {
  @include theme($theme: DarkRed);
}
```
CSS
```
.info {
  background: DarkGray;
  box-shadow: 0 0 1px rgba(169, 169, 169, 0.25);
  color: #fff;
}
.alert {
  background: DarkRed;
  box-shadow: 0 0 1px rgba(139, 0, 0, 0.25);
  color: #fff;
}
```
* always include mixins before declaring other property
```
.sidebar {
  min-width: 200px;
  @include mixins.container(20%, 100%, white, 1rem);
}
```
* Or we can use `&` to include before
```
.sidebar {
  @include mixins.container(20%, 100%, white, 1rem);
  &{
    min-width: 200px;
  }
}
```
## Extend or Inheritance
* It lets share property of another selector
* If some property are reused in many selectors then we can create a parent selector and extend it to all selectors.
* `@extend selector_name` is used to extend css

```
/* This CSS will print because %message-shared is extended. */
%message-shared {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

// This CSS won't print because %equal-heights is never extended.
%equal-heights {
  display: flex;
  flex-wrap: wrap;
}

.message {
  @extend %message-shared;
}
```

## Operators
* SCSS provides tool to calculate 
* Can perform ` + - * math.div() %`

```
@use "sass:math";

article[role="main"] {
  width: math.div(600px, 960px) * 100%;
}
```