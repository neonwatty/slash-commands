const Calculator = require('../src/calculator');

// Simple test runner
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

function assertEquals(actual, expected) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, but got ${actual}`);
  }
}

// Test the calculator
const calc = new Calculator();

console.log('Running Calculator Tests...\n');

test('should add two positive numbers', () => {
  assertEquals(calc.add(2, 3), 5);
});

test('should add positive and negative numbers', () => {
  assertEquals(calc.add(5, -2), 3);
});

test('should subtract two numbers', () => {
  assertEquals(calc.subtract(10, 4), 6);
});

test('should subtract negative numbers', () => {
  assertEquals(calc.subtract(-3, -5), 2);
});

console.log('\nAll tests completed!');