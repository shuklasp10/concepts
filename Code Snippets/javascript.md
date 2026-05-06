# Web developement Notes: CSS

## Table of Contents

- [Boilerplate](#Boilerplate)
- [Variables](#variables)
- [Control Structures](#control-structures)
- [Functions](#functions)
- [Data Structures](#data-structures)
- [Example Code](#example-code)
- [Resources](#resources)

## Dynamic checkboxes

```js
import { useState } from 'react'
import './App.css'

function App() {
  const [filters, setFilters] = useState({filter1: false, filter2: false, filter3: false});
  
  function handleSelectAll(e){
    const checked = e.target.checked;
    setFilters({filter1: checked, filter2: checked, filter3: checked})
  }

  function handleFilter(e){
    const filter = e.target.id;
    setFilters({...filters, [filter]:!filters[filter]})
  }

  const allSelected = Object.values(filters).every(value => value);

  return (
    <>
      <input type="checkbox" name="selectAll" id="selectAll" onChange={handleSelectAll} checked={allSelected} />
      <label htmlFor="selectAll">Select All</label><br />
      <input type="checkbox" name="filter1" id="filter1" onClick={handleFilter} checked={filters.filter1}/>
      <label htmlFor="filter1">Filter 1</label><br />
      <input type="checkbox" name="filter2" id="filter2" onClick={handleFilter} checked={filters.filter2} />
      <label htmlFor="filter2">Filter 2</label><br />
      <input type="checkbox" name="filter3" id="filter3" onClick={handleFilter} checked={filters.filter3} />
      <label htmlFor="filter3">Filter 3</label>
    </>
  )
}

export default App;
```

## object keys in array

`Object.keys(obj)`

## object values in array

`Object.values(obj);`
