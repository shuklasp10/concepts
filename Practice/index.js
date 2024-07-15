const element = document.querySelector('.heading');
const inputElement = document.querySelector('input');

element.addEventListener('click',()=>{
    console.log('clicked');
});

let file = ''

inputElement.addEventListener('change',()=>{
    file = inputElement.value
    console.log(file);
})