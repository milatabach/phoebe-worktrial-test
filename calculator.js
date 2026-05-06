/**
 * calculator.js — logic for calculator.html
 *
 * State machine approach:
 *   state can be: 'start' | 'operand1' | 'operator' | 'operand2' | 'result'
 */

(function () {
  "use strict";

  /* ── DOM refs ─────────────────────────────────────────────────── */
  const screen     = document.getElementById("calc-screen");
  const expression = document.getElementById("calc-expression");
  const grid       = document.getElementById("calc-grid");

  if (!screen || !grid) return; // not on the calculator page

  /* ── State ────────────────────────────────────────────────────── */
  let displayValue = "0";   // what shows on screen
  let operand1     = null;  // first stored number
  let operator     = null;  // pending operator symbol
  let waitingForOperand2 = false; // flag: next digit starts a fresh number
  let justEvaluated      = false; // flag: last action was "="

  /* ── Helpers ──────────────────────────────────────────────────── */

  /** Render the current display value to the screen element. */
  function updateScreen() {
    // Limit display to 12 significant digits to avoid overflow text
    let text = displayValue;

    // Parse to detect Infinity / NaN from a bad calculation
    const num = parseFloat(text);
    if (!isFinite(num) && text !== "0") {
      text = "Error";
    } else {
      // Trim trailing decimal if present after formatting
      // Cap at 12 significant digits
      if (text !== "Error" && text.replace("-", "").replace(".", "").length > 12) {
        text = parseFloat(parseFloat(text).toPrecision(12)).toString();
      }
    }

    screen.textContent = text;

    // Shrink font for long numbers
    screen.classList.toggle("small", text.length > 9);
  }

  /** Highlight / un-highlight the active operator button. */
  function setActiveOperator(op) {
    grid.querySelectorAll(".btn-operator").forEach((btn) => {
      const isActive = op !== null && btn.dataset.op === op;
      btn.classList.toggle("active-op", isActive);
    });
  }

  /** Map display operator symbols to JS operations. */
  function calculate(a, op, b) {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : Infinity;
      default:  return b;
    }
  }

  /** Format the result: avoid ugly floating-point tails. */
  function formatResult(n) {
    if (!isFinite(n)) return String(n); // "Infinity" or "NaN"
    // toPrecision can introduce scientific notation for very large/small values;
    // let JS handle that naturally but strip unnecessary trailing zeros.
    const str = parseFloat(n.toPrecision(12)).toString();
    return str;
  }

  /* ── Action handlers ─────────────────────────────────────────── */

  function handleDigit(digit) {
    if (justEvaluated) {
      // Start fresh after an "=" press
      displayValue = digit === "0" ? "0" : digit;
      operand1 = null;
      operator = null;
      setActiveOperator(null);
      justEvaluated = false;
      waitingForOperand2 = false;
    } else if (waitingForOperand2) {
      displayValue = digit;
      waitingForOperand2 = false;
    } else {
      // Append digit, but guard against leading zeros
      if (displayValue === "0" || displayValue === "-0") {
        displayValue = displayValue.startsWith("-") ? "-" + digit : digit;
      } else {
        // Max 12 digits in mantissa (excluding decimal point and minus)
        const digits = displayValue.replace(/[-.]/, "").length;
        if (digits < 12) {
          displayValue += digit;
        }
      }
    }
    updateScreen();
  }

  function handleDecimal() {
    if (justEvaluated) {
      displayValue = "0.";
      operand1 = null;
      operator = null;
      setActiveOperator(null);
      justEvaluated = false;
      waitingForOperand2 = false;
      updateScreen();
      return;
    }
    if (waitingForOperand2) {
      displayValue = "0.";
      waitingForOperand2 = false;
      updateScreen();
      return;
    }
    if (!displayValue.includes(".")) {
      displayValue += ".";
      updateScreen();
    }
  }

  function handleOperator(op) {
    justEvaluated = false;
    const current = parseFloat(displayValue);

    if (operator !== null && !waitingForOperand2) {
      // Chain calculation: evaluate pending operation first
      const result = calculate(operand1, operator, current);
      operand1 = result;
      displayValue = formatResult(result);
      expression.textContent = formatResult(result) + " " + op;
    } else {
      operand1 = current;
      expression.textContent = displayValue + " " + op;
    }

    operator = op;
    waitingForOperand2 = true;
    setActiveOperator(op);
    updateScreen();
  }

  function handleEquals() {
    if (operator === null || waitingForOperand2) {
      // Nothing to evaluate; just clear the active operator style
      setActiveOperator(null);
      expression.textContent = "";
      return;
    }

    const operand2 = parseFloat(displayValue);
    const result   = calculate(operand1, operator, operand2);

    expression.textContent = formatResult(operand1) + " " + operator + " " + formatResult(operand2) + " =";
    displayValue = formatResult(result);
    operand1 = null;
    operator = null;
    waitingForOperand2 = false;
    justEvaluated = true;
    setActiveOperator(null);
    updateScreen();
  }

  function handleClear() {
    displayValue       = "0";
    operand1           = null;
    operator           = null;
    waitingForOperand2 = false;
    justEvaluated      = false;
    expression.textContent = "";
    setActiveOperator(null);
    updateScreen();
  }

  function handleSign() {
    if (displayValue === "0") return;
    displayValue = displayValue.startsWith("-")
      ? displayValue.slice(1)
      : "-" + displayValue;
    updateScreen();
  }

  function handlePercent() {
    const val = parseFloat(displayValue);
    if (isNaN(val)) return;
    displayValue = formatResult(val / 100);
    updateScreen();
  }

  /* ── Event delegation on the button grid ─────────────────────── */
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".calc-btn");
    if (!btn) return;

    const action = btn.dataset.action;

    switch (action) {
      case "digit":   handleDigit(btn.dataset.digit);   break;
      case "decimal": handleDecimal();                  break;
      case "op":      handleOperator(btn.dataset.op);   break;
      case "equals":  handleEquals();                   break;
      case "clear":   handleClear();                    break;
      case "sign":    handleSign();                     break;
      case "percent": handlePercent();                  break;
    }
  });

  /* ── Keyboard support ─────────────────────────────────────────── */
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return; // don't hijack inputs

    const key = e.key;

    if (key >= "0" && key <= "9")  { handleDigit(key);  return; }
    if (key === ".")               { handleDecimal();    return; }
    if (key === "Enter" || key === "=") { handleEquals(); return; }
    if (key === "Escape" || key === "c" || key === "C") { handleClear(); return; }

    if (key === "+") { handleOperator("+"); return; }
    if (key === "-") { handleOperator("−"); return; }
    if (key === "*") { handleOperator("×"); return; }
    if (key === "/") { e.preventDefault(); handleOperator("÷"); return; }

    if (key === "%") { handlePercent(); return; }
    if (key === "Backspace") {
      if (justEvaluated || displayValue === "0") { handleClear(); return; }
      displayValue = displayValue.length > 1
        ? displayValue.slice(0, -1)
        : "0";
      updateScreen();
    }
  });

  /* ── Dynamic "AC" / "C" label ─────────────────────────────────── */
  const clearBtn = grid.querySelector('[data-action="clear"]');
  grid.addEventListener("click", () => {
    if (clearBtn) {
      clearBtn.textContent = displayValue === "0" ? "AC" : "C";
    }
  });

  // Initial render
  updateScreen();
})();
