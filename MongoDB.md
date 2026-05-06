# Web Developemnt Notes: MogoDB

## Table of Contents
- [Introduction](#introduction)
- [MongoDB Atlas](#mongodb-atlas)
- [Connecting NodeJS app to Atlas instance](#connecting-nodejs-app-to-atlas-instance)
- [Create Schema and Model](#create-schema-and-model)
- [Validation](#validation)
- [Queries](#queries)
- [Operators](#operators)
- [images in mongodb](#operators)


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
```[javascript]
//index.js
const mongoose = require('mongoose');

mongoose.connect('instanceURI with password')
.then(()=>{
    console.log('Database connected');
})
.catch((e)=>{
    console.log('Error in connecting database');
});

```

## MongoDB datatypes
1. String
2. Number
4. Boolean
5. Date
6. Array
7. Object
8. Object ID - 12 bytes hexadecimal, 5 byte timestamp, 5 Byte random value (3 byte machine Id & 2 byte for process id), 3 byte for counter
10. Mixed

## Create Schema and Model
```mongoose.Schema({})``` create collection schema  
```mongoose.model(name, schemaName)``` create collection model

```
//Model/userModel.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({name: String});

module.exports = mongoose.model('User', userSchema);
```

## Validation
* Defined in Schema.
* It's a middleware.
* Disbale automatic validation using
* Run manual validation using ```doc.validate``` or ```doc.validateSync()```

### define validation
```
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
})
```

### validation error
```
const userSchema = mongoose.Schema({
    name: {
        type: [String, 'value is not string'],
        minlength: [4, 'value is too small']
        required: true,
})
```

### common validators
- ```type : String || Number || Integer || Double || Boolean || Null || [String] || Object || Date```
- ```required : true || false```
- ```lowercase || uppercase : true || false``` converts string casing
- ```min || max : 0 || 1000``` For numbers range
- ```minlength || maxlength : 0 || 20``` for string length range
- ```unique : true || false```
- ```enum : ['pending','approved','rejected']``` enum validation, only given values allowed
- ```default: 0``` for default value if no value is provided.
- ```immutable : true || false``` restrict modification of value

### ref validators
__type__ - Set type of field as mongodb objectId.  
__ref__ - collection name where to look for objectId.
```
const userSchema = mongoose.Schema({
    friend : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})
```

### custom validators
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
        message: 'Value length must be less than 5'
    },
});
```

### this keyword
it is used to refer fields of current document instance.
```
const userSchema = mongoose.Schema({
    name: String,
    rating: Number,
    isEven: ()=>(this.rating % 2==0)
})
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
createdAt : {
    type: Date,
    default: ()=> new Date()
}
```
When schema is compiled this function will be stored and run each time document is created.

### Keypoints
1. ```update()``` _(or its alias ```updateMany```, ```updateOne```, ```findByIdAndUpdate()```, ```findOneAndUpdate()```)_ method does not trigger schema validation by default. It will directly update value in database.   
To run validator before update, use ```{runValidators: true}``` option
```
User.findByIdAndUpdate('id',{name:'Shri'},{runvalidators: true})
.then(()=>{console.log('User Updated')})
.catch((e)=>{console.log('Error in updating user')})
```


## Queries
1. Query can be executed on two ways
    * callback function is passed to execute query result.
    * ```.then()``` is used to execute query result.
2. ```const persons = await Person.find({})```. here persons (also called query) is of type ```Query()``` which can be chained for further queries.
3. query can be executed by either ```query.exec()``` or ```query.then()```


_```.then()``` is function provided by query that is used as promise but query itself is not a promise._


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
- Creates only one document
- ```save()``` is called to insert newly created document in collection
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
```User.findOne({})``` return single document or null.
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
Mongoose has 4 ways to update document
1. ```query.save()```
    * Recommended method to update database.
    * It works on doucment, so there must be document.
    * get document from ```create()``` or ```find()``` query.
    * runs validation before updating database.
2. ```Model.updateOne()``` & ```Model.updateMany()```
    * Atomically updates - update database without loading it first.
    * Better performance if document is huge.
    * doesn't run validation before updating.
    * Returns number of document updated
3. ```query.updateOne()```
    * Not recommended method.
    * Same as ```Model.updateOne()``` but runs on document.
4. ```Model.findOneAndUpdate()```
    * Same as ```Model.updateOne()``` except it returns updated document.

### deleting documents
```User.deleteOne({query})``` delete first matched query
```User.deleteMany({query})```  delete all matched query
both function return:
```
{
    "acknowledged": true,
    "deletedCount": 5
}
```

### counting documents
```User.countDocuments()```
return single number of total documents in collection

## Operators
Operators used to perform operations in queries

### comparison operators
| Operator | Use |
|--------|--------|
| ```$eq``` | equal to |
| ```$ne``` | not equal to |
| ```$lt``` | less than |
| ```$gt``` | greater than |
| ```$lte``` | less than or equal to |
| ```$gte``` | greater than or equal to |

```
User.find({age: {$gte: 30}});
```

### logical operator
| Operator | Use |
|--------|--------|
| ```$and``` | And |
| ```$or``` | Or |
| ```$not``` | Not |

```
User.find({
    $or : [
        {qty: {$lte: 10}},
        {qty: {$gte: 40}}
    ]
});
```

### element operator
Perform query based on presence of field in database
| Operator | Use |
|--------|--------|
| ```$exists``` | Check if field exists |
| ```$type``` | Check datatype of field value |
| ```$in``` | match field value from given array of values |
| ```$nin``` | doesn't match field value from given array of values |

```
User.find({
    name: {$exist: true, $in: ['Ramesh','Suresh','Aditya']}
});
```

### array operators
| Operator | Use |
|--------|--------|
| ```$all``` | match array contains all specified elements |
| ```$elemMatch``` | match array contains an element match spefified condition |
| ```$size``` | match array with given length |

```
```

### update operators
| Operator | Use |
|--------|--------|
| ```$set``` | Update a field rather than replacing document |
| ```$unset``` | remove field from document |
| ```$inc``` | increment value of field |
| ```$push``` | add new element to array |

### Evaluation operators
| Operator | Use |
|--------|--------|
| ```$add``` | Addition |
| ```$subtract``` | Substraction |
| ```$multiply``` | Multiplication |
| ```$divide``` | Division |
| ```$pow``` | Exponent |
| ```$mod``` | Modulous |
```
User.find({
    qty: {$mod: [10,2]}
});
```

### Keypoint
1. Use ```$set``` operator in ```update()``` function to partially update document instead of replacing entire document.

## images in mongodb
Common way:
1. Convert image in binary format such as Base64
    `image.toString('base64')`
2. Store it as binary data or BLOB (Binary Large OBject)
    Schema type: Buffer;
3. Retrieving data


