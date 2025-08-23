# Simple Calculator

A basic calculator implementation for testing purposes.

## Features

- Addition of two numbers
- Subtraction of two numbers

## Usage

```javascript
const Calculator = require('./src/calculator');

const calc = new Calculator();
console.log(calc.add(5, 3));      // 8
console.log(calc.subtract(10, 4)); // 6
```

## Testing

Run tests with:
```bash
npm test
```