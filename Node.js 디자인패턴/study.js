function* fruitGenerator() {
    yield 'apple';
    yield 'orange';
    return 'watermelon';
}

const newFruitGenerator = fruitGenerator();
console.log(newFruitGenerator.next()); // 1. { value: 'apple', done: false }
console.log(newFruitGenerator.next()); // 2. { value: 'orange', done: false }
console.log(newFruitGenerator.next()); // 3. { value: 'watermelon', done: true }