# Web Developemnt Notes: MogoDB

## Table of Contents
- [Introduction](#introduction)
- [Structure of MongoDB](#structure-of-mongodb)
- [Connecting NodeJS app to Atlas instance](#connecting-nodejs-app-to-atlas-instance)
- [Create Schema and Model](#create-schema-and-model)
- [Data validation](#data-validation)
- [Model operations](#model-operations)
- [Introduction](#introduction)

## Introduction
- __NoSQL__ database
- Stores in __JSON-like__ format _(BASON or Binary JSON format)_
- Used to handle __unstructured or semi-structured__ data

### Structure of MongoDB
Database => Collection => Document => key-value pair  
__document__ is single record or data object, similar to row in relational database.  
__collection__ group of document, similar to table.  
__schema__ structure and constraints defined for the fields in a document.  
__model__ abstraction over schema for web apps to work with data. Model contains schema definition with additinal functionality for data manipulation, querying and validation.

## MongoDB Atlas
__Project__ - Workspace or container contains group of clusters.  
__Clusters__ - Group of servers working for actual database deployment. It contains collections. 

## Connecting NodeJS app to Atlas instance
Use mongoose library to use mongodb features in nodejs.
```
//index.js
const express = require('express');
const mongoose = require('mongoose');

const app = express()
mongoose.connect('instanceURI with password')
.then(()=>{
    console.log('Database connected');
})
.catch((e)=>{
    console.log('Error in connecting database');
});

app.listen(3000,()=>{console.log('server is running')});
```

## Create Schema and Model
```mongoose.Schema({})``` create collection schema  
```mongoose.model(name, schemaName)``` create collection model

```
//Model/userModel.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({name: String});

module.exports = mongoose.model('User', userSchema);
```

## Data validation

### 2 ways to define constraints
```
const userSchema = mongoose.Schema({
    name: String
})
```
This method is used when we need additional constraints
```
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
})
```
### common contraints
- ```type : String || Number || Integer || Double || Boolean || Null || [String] || Object || Date```
- ```required : true || false```
- ```lowercase || uppercase : true || false``` converts string casing
- ```min || max : 0 || 1000``` For numbers range
- ```minlength || maxlength : 0 || 20``` for string length range
- ```unique : true || false```
- ```enum : ['pending','approved','rejected']``` enum validation, only given values allowed
- ```default: 0``` for default value if no value is provided.
- ```immutable : true || false``` restrict modification of value

### ref contrainsts
Used to reference a field value to other document's objectId.  
Set type as mongo objectId  
use ref to provide collection where to look for given objectId.
```
const userSchema = mongoose.Schema({
    friend : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})
```

### custom validation
```validate``` is used to define custom validation  
It contains two keys
- ```validator``` - function to check validation accept value as argument. Returns a Boolean
- ```message``` - error message to show if validation fails

```
const userSchema = mongoose.Schema({
    name: String,
    validate : {
        validator : (val) => {
            return val.length <=5
        }
    },
    message: 'Value length must be less than 5'
});
```

### Notes
1. ```update()``` _(or its alias ```updateMany```, ```updateOne```, ```findByIdAndUpdate()```, ```findOneAndUpdate()```)_ method does not trigger schema validation by default. It will directly update value in database.   
To run validator before update use ```{runValidators: true}``` option
```
User.findByIdAndUpdate('id',{name:'Shri'},{runvalidators: true})
.then(()=>{console.log('User Updated')})
.catch((e)=>{console.log('Error in updating user')})
```

### date as default value
Using current date as default value. eg createdAt field  
- Wrong approach
```
createdAt : new Date()
```
when schema is compiled it will get replaced by static value which will be used for all document creation.

- Correct approach
```
createdAt : ()=>(new Date())
```
When schema is compiled this function will be stored and run each time document is created.

## Model operations
for model ```User``` 

### creating document
```User.create()```
- Creates one or more document.
- Auto insert in collection.   
```
User.create({
    fname: 'shri',
    lname: 'shukla',
})
.then((newUser)=>{
    console.log('User created');
})
.catch((e)=>{
    console.log('User not created');
})

```
```new user()```
- Creates one document
- ```save()``` is called to insert in collection
```
const newUser = new User({
    fname: 'shri',
    lname: 'shukla',
});

newUser.save()
.then((savedUser)=>{
    console.log('user created');
})
.catch((e)=>{
    console.log('user not created');
});
```

### reading document
```User.find({})``` return array of documents or empty array.  
```User.findOne({})``` return single document or null
```
User.find({ age: { $gte: 30 } }) //age >= 30
    .then(data => {
        console.log('Users with age >= 30:', data);
    })
    .catch(error => {
        console.error('Error', error);
    });
``` 
```User.findById('id')``` return single document or null  
```User.findByIdAndDelete('id')``` return singledeleted document or null  
```User.findByIdAndUpdate('id',{age:40})``` return updated document or null  

### updating documents
```User.updateOne({query},{new:value})```  
```User.updateMany({query},{new:value})```

### deleting documents
```User.deleteOne({query})```  
```User.deleteMany({query})```  

### counting documents
```User.countDocuments()```