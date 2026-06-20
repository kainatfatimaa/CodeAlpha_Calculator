// DOM references
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// App state
let expression = '';
let currentTheme = localStorage.getItem('calculator-theme') || 'dark';
let historyListItems = [];

function updateTheme() {
  document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  themeIcon.textContent = currentTheme === 'dark' ? '☀' : '🌙';
}

function saveHistory() {
  localStorage.setItem('calculator-history', JSON.stringify(historyListItems));
}

function loadHistory() {
  const stored = localStorage.getItem('calculator-history');
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      historyListItems = parsed;
    }
  } catch (error) {
    console.warn('Could not parse history from localStorage');
  }
}

// Restore saved history and theme
loadHistory();

function renderHistory() {
  historyList.innerHTML = '';
  historyListItems.slice(-6).reverse().forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    historyList.appendChild(li);
  });
}

function updateTextScale() {
  const baseText = expression || '0';
  const resultText = resultEl.textContent || '0';
  const textLength = Math.max(baseText.length, resultText.length);

  let scale = 2;
  if (textLength > 12) {
    scale = Math.max(1.1, 2.4 - (textLength - 12) * 0.12);
  } else if (textLength > 8) {
    scale = Math.max(1.4, 2.2 - (textLength - 8) * 0.1);
  }

  expressionEl.style.fontSize = `${Math.max(0.9, scale * 0.44)}rem`;
  resultEl.style.fontSize = `${Math.max(1.5, scale)}rem`;
}

function updateDisplay() {
  expressionEl.textContent = expression || '0';

  if (!expression) {
    resultEl.textContent = '0';
  } else {
    const preview = calculateResult();
    const lastChar = expression.slice(-1);

    if (preview === 'Error' || /[+\-×÷]$/.test(expression) || lastChar === '.') {
      resultEl.textContent = '';
    } else {
      resultEl.textContent = preview;
    }
  }

  updateTextScale();
}

function appendToExpression(value) {
  if (expression === '0' && value !== '.') {
    expression = value;
  } else {
    expression += value;
  }

  updateDisplay();
}

function isOperator(value) {
  return ['+', '-', '×', '÷'].includes(value);
}

function sanitizeExpression(input) {
  return input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/%/g, '/100')
    .replace(/[^0-9+\-*/.()]/g, '');
}

function calculateResult() {
  if (!expression || expression === '0') {
    return '0';
  }

  const sanitized = sanitizeExpression(expression);

  if (!sanitized || sanitized === '0') {
    return '0';
  }

  if (/^[+\-*/]$/.test(sanitized.slice(-1))) {
    return 'Error';
  }

  try {
    const result = Function(`"use strict"; return (${sanitized})`)();

    if (!Number.isFinite(result)) {
      return 'Error';
    }

    if (Math.abs(result) < 1e-12) {
      return '0';
    }

    return Number(result.toFixed(10)).toString();
  } catch (error) {
    return 'Error';
  }
}

function evaluateExpression() {
  const rawResult = calculateResult();

  if (rawResult === 'Error') {
    resultEl.textContent = 'Error';
    expressionEl.textContent = 'Invalid expression';
    return;
  }

  const displayValue = rawResult;
  const fullExpression = `${expression} = ${displayValue}`;
  historyListItems.push(fullExpression);
  saveHistory();
  renderHistory();
  expression = displayValue;
  updateDisplay();
}

function removeLastCharacter() {
  expression = expression.slice(0, -1);
  if (!expression) {
    expression = '';
  }
  updateDisplay();
}

function clearAll() {
  expression = '';
  updateDisplay();
}

function appendOperator(operator) {
  const lastChar = expression.slice(-1);

  if (expression === '' || expression === '0') {
    if (operator === '-') {
      expression = '-';
    } else {
      return;
    }
  } else if (isOperator(lastChar)) {
    expression = expression.slice(0, -1) + operator;
  } else {
    expression += operator;
  }

  updateDisplay();
}

function handleButtonClick(value) {
  const button = document.querySelector(`button[data-value="${value}"]`);
  if (button) {
    button.classList.add('active');
    setTimeout(() => button.classList.remove('active'), 120);
  }

  if (value === 'C') {
    clearAll();
    return;
  }

  if (value === '⌫') {
    removeLastCharacter();
    return;
  }

  if (value === '=') {
    evaluateExpression();
    return;
  }

  if (isOperator(value)) {
    appendOperator(value);
    return;
  }

  if (value === '.') {
    const lastNumber = expression.split(/[+\-×÷]/).pop();

    if (lastNumber.includes('.')) {
      return;
    }

    if (!expression || /[+\-×÷]$/.test(expression)) {
      expression += '0.';
    } else {
      expression += '.';
    }

    updateDisplay();
    return;
  }

  if (value === '%') {
    expression += '%';
    updateDisplay();
    return;
  }

  appendToExpression(value);
}

document.querySelectorAll('.btn').forEach((button) => {
  button.addEventListener('click', () => handleButtonClick(button.dataset.value));
});

window.addEventListener('keydown', (event) => {
  const key = event.key;
  const allowed = /[0-9.]/;

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleButtonClick('=');
  } else if (key === 'Backspace' || key === 'Delete') {
    event.preventDefault();
    handleButtonClick('⌫');
  } else if (key === 'Escape') {
    handleButtonClick('C');
  } else if (['+', '-', '*', '/', '%'].includes(key)) {
    const mapped = key === '*' ? '×' : key === '/' ? '÷' : key;
    handleButtonClick(mapped);
  } else if (allowed.test(key)) {
    handleButtonClick(key);
  }
});

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('calculator-theme', currentTheme);
  updateTheme();
});

clearHistoryBtn.addEventListener('click', () => {
  historyListItems = [];
  saveHistory();
  renderHistory();
});

updateTheme();
renderHistory();
updateDisplay();
