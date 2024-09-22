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

type Person = {
    name: string,
    gender: boolean
}

const person:Person ={
    name: 'John',
    gender: true
}

const getValue = (key: keyof Person): string => {
    return String(person[key])
}

getValue('gender')
