/* ============================================================
   binary-calculator.js
   A binary (base-2) calculator with a live base converter.

   Rules:
   • Only 0 and 1 are valid digit inputs.
   • Supports: + − × ÷
   • Display always shows binary; a sub-line shows the decimal.
   • The base-converter panel converts among bin / dec / hex / oct.
   ============================================================ */

(() => {
  // ── State ──────────────────────────────────────────────────────────────────
  let currentBin    = "0";   // binary string currently on screen
  let previousVal   = null;  // left-hand operand (stored as JS number)
  let pendingOp     = null;  // "+", "−", "×", "÷"
  let justEvaled    = false;
  let awaitOperand  = false; // true right after pressing an operator

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const screen     = document.getElementById("bin-screen");
  const expression = document.getElementById("bin-expression");
  const decLine    = document.getElementById("bin-decimal");

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Convert a binary string (may be prefixed with "−") to a JS integer.
   */
  function binToNum(bin) {
    if (!bin || bin === "0") return 0;
    const negative = bin.startsWith("−");
    const digits   = negative ? bin.slice(1) : bin;
    const n        = parseInt(digits, 2);
    return negative ? -n : n;
  }

  /**
   * Convert a JS integer to a binary display string.
   * Negative values are shown with a "−" prefix (not two's complement).
   */
  function numToBin(n) {
    if (!isFinite(n)) return n > 0 ? "Inf" : n < 0 ? "−Inf" : "Error";
    if (n === 0) return "0";
    const neg = n < 0;
    const abs = Math.abs(Math.round(n));          // integer arithmetic only
    return (neg ? "−" : "") + abs.toString(2);
  }

  /** Evaluate two numbers with a given operator. */
  function evaluate(a, op, b) {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : Math.trunc(a / b);  // integer division
      default:  return b;
    }
  }

  /** Update both display lines from currentBin. */
  function render() {
    screen.textContent = currentBin;

    // Adjust font size for long strings
    screen.classList.toggle("small", currentBin.replace("−", "").length > 12);

    // Decimal equivalent
    const num = binToNum(currentBin);
    decLine.textContent = isFinite(num) ? `decimal: ${num}` : "";

    // Expression line
    if (pendingOp && previousVal !== null && !justEvaled) {
      expression.textContent = `${numToBin(previousVal)} ${pendingOp}`;
    } else {
      expression.textContent = "\u00a0";
    }
  }

  // ── Button handlers ────────────────────────────────────────────────────────

  function handleDigit(digit) {
    if (awaitOperand || justEvaled) {
      currentBin   = digit === "0" ? "0" : digit;
      awaitOperand = false;
      justEvaled   = false;
    } else if (currentBin === "0" && digit === "0") {
      // keep leading "0"
    } else if (currentBin === "0") {
      currentBin = digit;
    } else if (currentBin.replace("−", "").length >= 20) {
      // Cap at 20 binary digits (~1 million)
    } else {
      currentBin += digit;
    }
    render();
  }

  function handleOperator(op) {
    const num = binToNum(currentBin);

    if (previousVal !== null && pendingOp && !awaitOperand) {
      // Chain evaluation
      const result = evaluate(previousVal, pendingOp, num);
      previousVal  = result;
      currentBin   = numToBin(result);
    } else {
      previousVal = num;
    }

    pendingOp    = op;
    awaitOperand = true;
    justEvaled   = false;
    render();
  }

  function handleEquals() {
    if (pendingOp === null || previousVal === null) return;

    const num    = binToNum(currentBin);
    const result = evaluate(previousVal, pendingOp, num);

    expression.textContent =
      `${numToBin(previousVal)} ${pendingOp} ${currentBin} =`;

    currentBin   = numToBin(result);
    previousVal  = null;
    pendingOp    = null;
    justEvaled   = true;
    awaitOperand = false;

    screen.textContent = currentBin;
    screen.classList.toggle("small", currentBin.replace("−", "").length > 12);
    decLine.textContent = `decimal: ${binToNum(currentBin)}`;
  }

  function handleClear() {
    currentBin   = "0";
    previousVal  = null;
    pendingOp    = null;
    justEvaled   = false;
    awaitOperand = false;
    render();
  }

  function handleSign() {
    if (currentBin === "0") return;
    currentBin = currentBin.startsWith("−")
      ? currentBin.slice(1)
      : "−" + currentBin;
    render();
  }

  function handleBackspace() {
    if (justEvaled || awaitOperand || currentBin === "0") return;
    currentBin = currentBin.length > 1 ? currentBin.slice(0, -1) : "0";
    render();
  }

  // ── Event delegation ───────────────────────────────────────────────────────
  document.querySelector(".bin-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    switch (btn.dataset.action) {
      case "digit":     handleDigit(btn.dataset.value); break;
      case "operator":  handleOperator(btn.dataset.value); break;
      case "equals":    handleEquals();  break;
      case "clear":     handleClear();   break;
      case "sign":      handleSign();    break;
      case "backspace": handleBackspace(); break;
    }
  });

  // ── Keyboard support ───────────────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (!document.querySelector(".bin-calc")) return;

    // Ignore if a converter input is focused
    if (["conv-bin","conv-dec","conv-hex","conv-oct"]
        .includes(document.activeElement.id)) return;

    switch (e.key) {
      case "0": handleDigit("0"); break;
      case "1": handleDigit("1"); break;
      case "+": handleOperator("+"); break;
      case "-": handleOperator("−"); break;
      case "*": handleOperator("×"); break;
      case "/": e.preventDefault(); handleOperator("÷"); break;
      case "Enter":
      case "=": handleEquals(); break;
      case "Escape":
      case "Delete": handleClear(); break;
      case "Backspace": handleBackspace(); break;
    }
  });

  // ── Initial render ─────────────────────────────────────────────────────────
  render();


  // ══════════════════════════════════════════════════════════════════════════
  // Base Converter
  // ══════════════════════════════════════════════════════════════════════════

  const convBin = document.getElementById("conv-bin");
  const convDec = document.getElementById("conv-dec");
  const convHex = document.getElementById("conv-hex");
  const convOct = document.getElementById("conv-oct");
  const convErr = document.getElementById("conv-error");

  /** Validate and parse a string in a given base. Returns NaN on error. */
  function parseBase(str, base) {
    str = str.trim();
    if (!str) return NaN;
    const negative = str.startsWith("-");
    const digits   = negative ? str.slice(1) : str;
    if (!digits) return NaN;

    const patterns = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-fA-F]+$/ };
    if (!patterns[base].test(digits)) return NaN;

    const n = parseInt(digits, base);
    return negative ? -n : n;
  }

  /** Fill all converter fields from a given integer value. */
  function fillConverterFrom(n, skipId) {
    if (!isFinite(n)) return;
    const neg = n < 0;
    const abs = Math.abs(n);
    const pfx = neg ? "-" : "";

    if (skipId !== "conv-bin") convBin.value = pfx + abs.toString(2);
    if (skipId !== "conv-dec") convDec.value = n.toString(10);
    if (skipId !== "conv-hex") convHex.value = pfx + abs.toString(16).toUpperCase();
    if (skipId !== "conv-oct") convOct.value = pfx + abs.toString(8);
  }

  function makeConverterHandler(inputEl, base) {
    return () => {
      convErr.textContent = "";
      const val = inputEl.value.trim();
      if (!val) {
        // Clear all other fields when this one is emptied
        [convBin, convDec, convHex, convOct].forEach(el => {
          if (el !== inputEl) el.value = "";
        });
        return;
      }
      const n = parseBase(val, base);
      if (isNaN(n)) {
        convErr.textContent = `"${val}" is not a valid base-${base} number.`;
        return;
      }
      fillConverterFrom(n, inputEl.id);
    };
  }

  convBin.addEventListener("input", makeConverterHandler(convBin, 2));
  convDec.addEventListener("input", makeConverterHandler(convDec, 10));
  convHex.addEventListener("input", makeConverterHandler(convHex, 16));
  convOct.addEventListener("input", makeConverterHandler(convOct, 8));
})();
