# MicroVision

### See every bit move through a computer.

[Launch MicroVision](https://usamahmoin.github.io/Microvision/) ·
[Read the story](https://usamahmoin.github.io/Microvision/?page=about)

MicroVision is an interactive computer architecture explorer built to make the
hidden work inside a processor visible. Write a small assembly program, advance
it one clock cycle at a time, and watch instructions, registers, control
signals, buses, memory, and performance metrics change together.

The project is designed for students, educators, and curious engineers who want
to build intuition instead of memorizing isolated diagrams.

## Why I Built It

MicroVision grew from years of teaching computer hardware, architecture, and
operating systems. A whiteboard can explain a datapath, but it cannot make a
carry bit travel, show a pipeline bubble consuming a cycle, or let a student
break a CPU connection and diagnose the result.

I wanted those invisible events to become observable and interactive. The goal
is simple: slow the machine down enough that someone can follow the data, form a
mental model, and appreciate how much careful engineering sits beneath every
program.

> A CPU stops feeling like magic when you can follow the data.

## What You Can Explore

### Live CPU Simulator

Run a compact assembly program through a visual six-stage datapath:

```asm
MOV R1, 10
MOV R2, 20
ADD R3, R1, R2
STORE R3, [100]
```

The simulator exposes:

- Fetch, decode, register read, execute, memory, and write-back stages
- Live register and memory updates
- Control signals and decoded bus values
- A logic analyzer with clock, control, data, and valid traces
- Cycle history, CPI, cache hit rate, and pipeline stall metrics

### Architecture Labs

| Lab | What it teaches |
| --- | --- |
| **ALU Explorer** | Arithmetic, Boolean logic, shifts, carry propagation, and status flags one bit at a time |
| **Pipeline** | Overlapped execution, RAW hazards, stalls, bubbles, forwarding, and CPI |
| **Cache Lab** | Address mapping, tags, hits, misses, evictions, associativity, and replacement |
| **Branch Predictor** | Static prediction, one-bit and two-bit predictors, confidence states, and pipeline flushes |
| **Build a CPU** | Datapath components, explicit buses, control flow, validation, and signal traversal |
| **Performance Lab** | Workloads, clock speed, issue width, IPC, CPI, cache behavior, branch accuracy, and bottlenecks |

Each lab combines an interactive workbench with a plain-language explanation,
a suggested experiment, and a glossary of the architecture terms used on the
page.

## Learning Flow

```mermaid
flowchart LR
    A[Change an input] --> B[Run or step the model]
    B --> C[Watch state and data move]
    C --> D[Read why it happened]
    D --> E[Try a different design]
```

MicroVision favors direct cause and effect. Change one value, strategy, or
connection and the visualization responds immediately.

## Technology

- React 19
- TypeScript
- Vite
- SVG and CSS animation
- Lucide icons
- GitHub Actions and GitHub Pages

The simulations currently run entirely in the browser. No backend or account is
required.

## Run Locally

Requirements:

- Node.js 22 or newer
- npm

```bash
git clone https://github.com/UsamahMoin/Microvision.git
cd Microvision
npm install
npm run dev
```

Then open the local URL printed by Vite.

### Available Commands

```bash
npm run dev      # Start the development server
npm run build    # Type-check and create a production build
npm run preview  # Preview the production build locally
```

## Project Structure

```text
Microvision/
├── src/
│   ├── App.tsx          # Homepage, simulator, navigation, and About page
│   ├── LabPages.tsx     # Six interactive architecture labs
│   ├── styles.css       # Visual system, animation, and responsive layouts
│   └── main.tsx         # React entry point
├── .github/workflows/
│   └── deploy-pages.yml # GitHub Pages deployment
├── index.html
├── vite.config.ts
└── package.json
```

## Educational Scope

MicroVision uses intentionally compact models so that behavior remains legible.
The simulator is not an implementation of a specific commercial ISA or
microarchitecture. It preserves the important relationships students need to
reason about architecture while leaving room for future, more detailed models.

## Deployment

Every push to `main` runs the production build and deploys the generated site to
GitHub Pages through GitHub Actions.

Live site: [usamahmoin.github.io/Microvision](https://usamahmoin.github.io/Microvision/)

---

Built with a love for computer science, teaching, and the moment a difficult
system finally becomes clear.
