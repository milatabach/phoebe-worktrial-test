(() => {
  // ── State ──────────────────────────────────────────────────────────────────
  let currentValue  = "0";   // number currently shown on the display
  let previousValue = null;  // left-hand operand
  let pendingOp     = null;  // pending operator symbol ( +  −  ×  ÷ )
  let justEvaled    = false; // true right after pressing "="

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const screen     = document.getElementById("calc-screen");
  const expression = document.getElementById("calc-expression");

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Format a number for display (max 12 significant digits, no long floats). */
  function fmt(n) {
    if (!isFinite(n)) return n > 0 ? "Infinity" : n < 0 ? "−Infinity" : "Error";
    const s = parseFloat(n.toPrecision(12)).toString();
    // Replace plain minus with proper minus sign
    return s.replace("-", "−");
  }

  /** Evaluate two numbers with a given operator symbol. */
  function evaluate(a, op, b) {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default:  return b;
    }
  }

  /** Render the current display state. */
  function render() {
    screen.textContent = currentValue;

    if (pendingOp && previousValue !== null && !justEvaled) {
      expression.textContent = `${fmt(previousValue)} ${pendingOp}`;
    } else if (justEvaled && pendingOp === null) {
      expression.textContent = "\u00a0"; // nbsp — clear after final result
    } else {
      expression.textContent = "\u00a0";
    }
  }

  // ── Button actions ─────────────────────────────────────────────────────────

  function handleDigit(digit) {
    if (justEvaled) {
      // Start fresh after a completed calculation
      currentValue = digit === "0" ? "0" : digit;
      previousValue = null;
      pendingOp = null;
      justEvaled = false;
    } else if (currentValue === "0" && digit !== "0") {
      currentValue = digit;
    } else if (currentValue === "0" && digit === "0") {
      // keep as "0"
    } else if (currentValue.replace("−", "").replace(".", "").length >= 12) {
      // Limit input length
    } else {
      currentValue += digit;
    }
    render();
  }

  function handleDecimal() {
    if (justEvaled) {
      currentValue = "0.";
      justEvaled = false;
    } else if (!currentValue.includes(".")) {
      currentValue += ".";
    }
    render();
  }

  function handleOperator(op) {
    justEvaled = false;
    const num = parseFloat(currentValue.replace("−", "-"));

    if (previousValue !== null && pendingOp) {
      // Chain: evaluate what we have so far
      const result = evaluate(previousValue, pendingOp, num);
      previousValue = result;
      currentValue = fmt(result);
    } else {
      previousValue = num;
    }

    pendingOp = op;
    // After pressing an operator, the next digit starts a new entry
    // We flag this by "resetting" the current display on the next digit press
    justEvaled = false;
    // We do want to clear the display on the next digit — use a small flag
    currentValue = fmt(previousValue);
    // But mark that next digit input should overwrite
    _awaitingOperand = true;

    render();
  }

  // Extra flag: are we waiting for the right-hand operand?
  let _awaitingOperand = false;

  // Override handleDigit to respect _awaitingOperand
  const _baseHandleDigit = handleDigit;
  function handleDigitWrapped(digit) {
    if (_awaitingOperand) {
      currentValue = digit === "0" ? "0" : digit;
      _awaitingOperand = false;
      render();
    } else {
      _baseHandleDigit(digit);
    }
  }

  function handleEquals() {
    if (pendingOp === null || previousValue === null) return;

    const num    = parseFloat(currentValue.replace("−", "-"));
    const result = evaluate(previousValue, pendingOp, num);

    expression.textContent = `${fmt(previousValue)} ${pendingOp} ${currentValue} =`;
    currentValue  = fmt(result);
    previousValue = null;
    pendingOp     = null;
    justEvaled    = true;
    _awaitingOperand = false;

    screen.textContent = currentValue;
  }

  function handleClear() {
    currentValue     = "0";
    previousValue    = null;
    pendingOp        = null;
    justEvaled       = false;
    _awaitingOperand = false;
    render();
  }

  function handleSign() {
    if (currentValue === "0") return;
    if (currentValue.startsWith("−")) {
      currentValue = currentValue.slice(1);
    } else {
      currentValue = "−" + currentValue;
    }
    render();
  }

  function handlePercent() {
    const num = parseFloat(currentValue.replace("−", "-"));
    currentValue = fmt(num / 100);
    render();
  }

  // ── Event delegation ───────────────────────────────────────────────────────
  document.querySelector(".calc-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    switch (action) {
      case "digit":    handleDigitWrapped(value); break;
      case "decimal":  handleDecimal();           break;
      case "operator": handleOperator(value);     break;
      case "equals":   handleEquals();            break;
      case "clear":    handleClear();             break;
      case "sign":     handleSign();              break;
      case "percent":  handlePercent();           break;
    }
  });

  // ── Keyboard support ───────────────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    // Only activate when the calculator page is loaded
    if (!document.querySelector(".calc")) return;

    if (e.key >= "0" && e.key <= "9") { handleDigitWrapped(e.key); return; }
    switch (e.key) {
      case ".":
      case ",":        handleDecimal();      break;
      case "+":        handleOperator("+");  break;
      case "-":        handleOperator("−");  break;
      case "*":        handleOperator("×");  break;
      case "/":        e.preventDefault(); handleOperator("÷"); break;
      case "Enter":
      case "=":        handleEquals();       break;
      case "Escape":
      case "Delete":   handleClear();        break;
      case "Backspace":
        if (!justEvaled && !_awaitingOperand) {
          if (currentValue.length > 1) {
            currentValue = currentValue.slice(0, -1) || "0";
          } else {
            currentValue = "0";
          }
          render();
        }
        break;
    }
  });

  // ── Initial render ─────────────────────────────────────────────────────────
  render();
})();
