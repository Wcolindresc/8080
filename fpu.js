class FloatingPointCoprocessor {
    constructor() {
        this.registers = new Float32Array(4);
        this.history = [];
        this.lastStatus = 'READY';
    }

    toFloat32(value) {
        return new Float32Array([Number(value)])[0];
    }

    toHex(value) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, this.toFloat32(value), false);
        return '0x' + view.getUint32(0, false).toString(16).toUpperCase().padStart(8, '0');
    }

    toBinary(value) {
        const hex = this.toHex(value).slice(2);
        return parseInt(hex, 16).toString(2).padStart(32, '0');
    }

    decodeIEEE754(value) {
        const bits = this.toBinary(value);
        return {
            sign: bits[0],
            exponent: bits.slice(1, 9),
            mantissa: bits.slice(9)
        };
    }

    execute(operation, a, b = 0) {
        const opA = this.toFloat32(a);
        const opB = this.toFloat32(b);
        let result;

        switch (operation) {
            case 'add': result = opA + opB; break;
            case 'sub': result = opA - opB; break;
            case 'mul': result = opA * opB; break;
            case 'div':
                if (opB === 0) throw new Error('División entre cero no permitida.');
                result = opA / opB;
                break;
            case 'sqrt':
                if (opA < 0) throw new Error('No se puede calcular raíz cuadrada real de un número negativo.');
                result = Math.sqrt(opA);
                break;
            default:
                throw new Error('Operación FPU no válida.');
        }

        result = this.toFloat32(result);
        this.registers[0] = opA;
        this.registers[1] = opB;
        this.registers[2] = result;
        this.registers[3] = this.toFloat32(this.history.length + 1);
        this.lastStatus = Number.isFinite(result) ? 'OK' : 'OVERFLOW';

        const item = {
            id: this.history.length + 1,
            operation,
            a: opA,
            b: opB,
            result,
            hex: this.toHex(result)
        };

        this.history.push(item);
        if (this.history.length > 10) this.history.shift();
        return item;
    }

    reset() {
        this.registers.fill(0);
        this.history = [];
        this.lastStatus = 'READY';
    }
}

const fpu = new FloatingPointCoprocessor();

function formatFloat(value) {
    if (!Number.isFinite(value)) return String(value);
    const abs = Math.abs(value);
    if ((abs !== 0 && abs < 0.000001) || abs >= 10000000) return value.toExponential(6);
    return Number(value.toFixed(6)).toString();
}

function operationLabel(op) {
    return {
        add: 'Suma',
        sub: 'Resta',
        mul: 'Multiplicación',
        div: 'División',
        sqrt: 'Raíz cuadrada'
    }[op] || op;
}

function updateFPUUI(lastItem = null) {
    for (let i = 0; i < 4; i++) {
        const element = document.getElementById('fpu-f' + i);
        if (element) element.textContent = formatFloat(fpu.registers[i]);
    }

    const status = document.getElementById('fpu-status');
    if (status) status.textContent = fpu.lastStatus;

    if (lastItem) {
        document.getElementById('fpu-result').textContent = formatFloat(lastItem.result);
        document.getElementById('fpu-hex').textContent = lastItem.hex;

        const ieee = fpu.decodeIEEE754(lastItem.result);
        document.getElementById('ieee-sign').textContent = ieee.sign;
        document.getElementById('ieee-exp').textContent = ieee.exponent;
        document.getElementById('ieee-mantissa').textContent = ieee.mantissa;
    } else {
        document.getElementById('fpu-result').textContent = '0';
        document.getElementById('fpu-hex').textContent = '0x00000000';
        document.getElementById('ieee-sign').textContent = '0';
        document.getElementById('ieee-exp').textContent = '00000000';
        document.getElementById('ieee-mantissa').textContent = '00000000000000000000000';
    }

    renderFPUHistory();
    drawFPUChart();
}

function renderFPUHistory() {
    const body = document.getElementById('fpu-history-body');
    if (!body) return;

    body.innerHTML = '';
    [...fpu.history].reverse().forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${operationLabel(item.operation)}</td>
            <td>${formatFloat(item.a)}</td>
            <td>${item.operation === 'sqrt' ? '—' : formatFloat(item.b)}</td>
            <td>${formatFloat(item.result)}</td>
            <td>${item.hex}</td>
        `;
        body.appendChild(tr);
    });

    if (fpu.history.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" class="empty-history">Sin operaciones ejecutadas</td>';
        body.appendChild(tr);
    }
}

function drawFPUChart() {
    const canvas = document.getElementById('fpu-chart');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(600, rect.width * dpr);
    canvas.height = 280 * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const left = 55, right = 20, top = 25, bottom = 45;
    const plotW = width - left - right;
    const plotH = height - top - bottom;

    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px Segoe UI, sans-serif';

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + plotH);
    ctx.lineTo(left + plotW, top + plotH);
    ctx.stroke();

    if (fpu.history.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('Ejecuta operaciones para generar la gráfica', width / 2, height / 2);
        return;
    }

    const values = fpu.history.map(x => x.result);
    let min = Math.min(...values, 0);
    let max = Math.max(...values, 0);
    if (min === max) {
        min -= 1;
        max += 1;
    }

    const range = max - min;
    const y = value => top + plotH - ((value - min) / range) * plotH;
    const stepX = fpu.history.length > 1 ? plotW / (fpu.history.length - 1) : plotW / 2;

    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(formatFloat(max), left - 8, top + 4);
    ctx.fillText(formatFloat(min), left - 8, top + plotH + 4);
    ctx.fillText('0', left - 8, y(0) + 4);

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(left, y(0));
    ctx.lineTo(left + plotW, y(0));
    ctx.stroke();

    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    fpu.history.forEach((item, i) => {
        const x = fpu.history.length > 1 ? left + (i * stepX) : left + plotW / 2;
        const py = y(item.result);
        if (i === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
    });
    ctx.stroke();

    fpu.history.forEach((item, i) => {
        const x = fpu.history.length > 1 ? left + (i * stepX) : left + plotW / 2;
        const py = y(item.result);
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.arc(x, py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText('#' + item.id, x, top + plotH + 22);
    });

    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.fillText('Historial de resultados del coprocesador FPU', width / 2, height - 8);
}

function executeFPUFromUI() {
    const operation = document.getElementById('fpu-operation').value;
    const a = Number(document.getElementById('fpu-a').value);
    const b = Number(document.getElementById('fpu-b').value);
    const message = document.getElementById('fpu-message');

    if (!Number.isFinite(a) || (operation !== 'sqrt' && !Number.isFinite(b))) {
        message.textContent = 'Ingrese operandos numéricos válidos.';
        message.className = 'fpu-message error';
        return;
    }

    try {
        const item = fpu.execute(operation, a, b);
        message.textContent = 'Operación enviada por el bus conceptual CPU → FPU y ejecutada correctamente.';
        message.className = 'fpu-message success';
        updateFPUUI(item);
    } catch (error) {
        message.textContent = error.message;
        message.className = 'fpu-message error';
    }
}

document.getElementById('btn-fpu-execute').addEventListener('click', executeFPUFromUI);

document.getElementById('btn-fpu-demo').addEventListener('click', () => {
    document.getElementById('fpu-a').value = '12.75';
    document.getElementById('fpu-b').value = '3.5';
    document.getElementById('fpu-operation').value = 'mul';
    executeFPUFromUI();
});

document.getElementById('btn-fpu-reset').addEventListener('click', () => {
    fpu.reset();
    document.getElementById('fpu-message').textContent = 'FPU reiniciada.';
    document.getElementById('fpu-message').className = 'fpu-message';
    updateFPUUI();
});

document.getElementById('fpu-operation').addEventListener('change', event => {
    const inputB = document.getElementById('fpu-b');
    inputB.disabled = event.target.value === 'sqrt';
});

window.addEventListener('resize', drawFPUChart);
updateFPUUI();
