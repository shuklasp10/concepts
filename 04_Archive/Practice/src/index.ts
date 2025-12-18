// type FuncType = (n: string, m: string) => string

// const func: FuncType = function(n,m){
//     return n+m;
// }

// func('Hello', "World")

// const lol = (): never =>{
//     throw new Error();
// }

// type ThemeMode = "Light" | "Dark"

// let theme: ThemeMode = "Dark"

// class Player {
//     height: number;
//     width: number;
//     constructor(height: number, width: number){
//         this.height = height;
//         this.width = width;
//     }
// }

// const player1 = new Player(100,200);
// player1.width = 23

// interface ProductType {
//     name: string,
//     amount: number,
//     stock: number,
//     offer?:boolean,
//     avail: boolean
// }

// interface GiveId {
//     getId: string
// }

// class Product implements ProductType, GiveId {
//     private id = String(Math.random()*100)
//     protected avail = false
//     constructor(
//         public name: string,
//         public amount: number,
//         public stock: number
//     ){}

//     get getId():string{
//         return this.id
//     }
// }

// const sample = new Product("Apple",20000, 500);

// type Person = {
//     name: string,
//     gender: boolean
// }

// const person:Person ={
//     name: 'John',
//     gender: true
// }

// const getValue = (key: keyof Person): string => {
//     return String(person[key])
// }

// getValue('gender')


// type Person = {
//     name: string,
//     age: number
// }

// const person: Person = {
//     name: 'John',
//     age: 29
// }

// const func = <T>(n: T): T => {
//     return n
// }

// var a = func("Hello")
// var b = func(23);
// var c = func<Person>({ name: "abhi", age: 26 })

// type Person = {
//     name: string,
//     age: number
// }

// const person: Person = {
//     name: 'John',
//     age: 20
// }

// const func = <T, O extends T>(m: T, n: O): void =>{}

// func(person, {
//     name:'Peter',
//     address: 'London',
//     age: 29
// })

type Users = {
    name: string,
    age: number
}

const users = [
    {
        name: 'John',
        age: 29
    },
    {
        name: 'Peter',
        age: 32
    },
    {
        name: 'Mark',
        age: 57
    },
    {
        name: 'Chris',
        age: 18
    },
]

const filterUsers = <T, O extends keyof T>(users: T[], key:O , value: T[O]): T[]=> {
        return users.filter(user=> user[key]===value)
}

const filteredUsers = filterUsers(users, "age", 23)