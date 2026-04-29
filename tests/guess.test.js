/**
 * 猜数字游戏 - 单元测试
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');

// 提取可测试的核心逻辑
function generateTarget() {
  return Math.floor(Math.random() * 100) + 1;
}

function validateGuess(guess) {
  if (isNaN(guess) || guess < 1 || guess > 100) {
    return { valid: false, reason: 'out_of_range' };
  }
  return { valid: true };
}

function compareGuess(guess, target) {
  if (guess === target) return 'correct';
  if (guess > target) return 'too_big';
  return 'too_small';
}

describe('猜数字核心逻辑', () => {

  test('目标数字在1~100之间', () => {
    for (let i = 0; i < 100; i++) {
      const target = generateTarget();
      assert.ok(target >= 1 && target <= 100, `目标数字${target}超出范围`);
    }
  });

  test('合法猜测通过验证', () => {
    assert.strictEqual(validateGuess(1).valid, true);
    assert.strictEqual(validateGuess(50).valid, true);
    assert.strictEqual(validateGuess(100).valid, true);
  });

  test('非法猜测被拒绝', () => {
    assert.strictEqual(validateGuess(0).valid, false);
    assert.strictEqual(validateGuess(101).valid, false);
    assert.strictEqual(validateGuess(-1).valid, false);
    assert.strictEqual(validateGuess(NaN).valid, false);
    assert.strictEqual(validateGuess('abc').valid, false);
  });

  test('比较逻辑正确', () => {
    assert.strictEqual(compareGuess(50, 50), 'correct');
    assert.strictEqual(compareGuess(50, 30), 'too_big');
    assert.strictEqual(compareGuess(30, 50), 'too_small');
  });

  test('边界值验证', () => {
    assert.strictEqual(validateGuess(1).valid, true);
    assert.strictEqual(validateGuess(100).valid, true);
    assert.strictEqual(validateGuess(0).valid, false);
    assert.strictEqual(validateGuess(101).valid, false);
  });

});
