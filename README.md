# Intel 8080 CPU Emulator + Coprocesador FPU Conceptual - Version 3.0

Fork académico del proyecto original **Intel 8080 CPU Emulator & Assembler**, ampliado con la integración conceptual de un coprocesador de punto flotante.

## Objetivo de la ampliación

El Intel 8080 trabaja principalmente con aritmética entera de 8 y 16 bits y no posee una unidad de punto flotante integrada. Esta versión agrega una **FPU conceptual externa** para representar de forma didáctica cómo una CPU puede delegar operaciones matemáticas de punto flotante a un coprocesador especializado.

> La FPU implementada no pretende afirmar que el Intel 8080 original incluía una FPU. Se presenta como una ampliación conceptual para fines educativos.

## Arquitectura conceptual

```text
┌──────────────────┐       BUS DE DATOS / CONTROL       ┌──────────────────┐
│    Intel 8080    │  ───────────────────────────────▶  │ FPU conceptual   │
│ Control / enteros│  ◀───────────────────────────────  │ Float32 IEEE 754 │
└──────────────────┘                                    └──────────────────┘
```

La CPU mantiene el control general del sistema y el coprocesador se utiliza para cálculos que requieren representación de punto flotante.

## Funcionalidades originales conservadas

- Emulador Intel 8080.
- Ensamblador integrado.
- Registros A, B, C, D, E, H y L.
- PC y SP.
- Banderas S, Z, AC, P y CY.
- Visualización de memoria.
- Visualización de pila.
- Ejecución completa, paso a paso y reinicio.

## Funcionalidades FPU agregadas

- Cuatro registros conceptuales de 32 bits: `F0`, `F1`, `F2` y `F3`.
- Operaciones Float32:
  - Suma.
  - Resta.
  - Multiplicación.
  - División.
  - Raíz cuadrada.
- Conversión automática a precisión simple mediante `Float32Array`.
- Representación IEEE 754:
  - Bit de signo.
  - Exponente de 8 bits.
  - Mantisa de 23 bits.
  - Valor hexadecimal de 32 bits.
- Historial de las últimas operaciones.
- Gráfica dinámica de resultados con Canvas HTML5.
- Diagrama visual de comunicación CPU ⇄ FPU.
- Demostración rápida incluida: `12.75 × 3.5 = 44.625`.

## Registros de la FPU

| Registro | Uso conceptual |
|---|---|
| F0 | Operando A |
| F1 | Operando B |
| F2 | Resultado |
| F3 | Contador de operaciones |


## Archivos principales

- `index.html`: interfaz del emulador y de la FPU.
- `styles.css`: diseño responsive.
- `cpu.js`: núcleo del Intel 8080.
- `assembler.js`: ensamblador.
- `main.js`: interfaz del CPU.
- `fpu.js`: coprocesador de punto flotante conceptual, IEEE 754, historial y gráfica.

## Entregable académico

El proyecto demuestra visualmente:

1. Funcionamiento del emulador Intel 8080.
2. Separación conceptual entre CPU y coprocesador.
3. Delegación de cálculos de punto flotante.
4. Registros propios de la FPU.
5. Operaciones Float32.
6. Representación IEEE 754.
7. Gráfica e historial de resultados.

**Fork:** Wcolindresc/8080  
**Versión académica:** 3.0 FPU  
**Tecnologías:** HTML5, CSS3 y JavaScript.
