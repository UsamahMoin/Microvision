import {
  ArrowLeft,
  ArrowRight,
  Box,
  BrainCircuit,
  Check,
  CircleDot,
  Cpu,
  Gauge,
  Layers3,
  MemoryStick,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  StepForward,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export type LabId =
  | "alu"
  | "pipeline"
  | "cache"
  | "branch"
  | "builder"
  | "performance";

export const LABS: Array<{
  id: LabId;
  index: string;
  title: string;
  eyebrow: string;
  description: string;
  color: string;
  icon: ReactNode;
}> = [
  {
    id: "alu",
    index: "01",
    title: "ALU Explorer",
    eyebrow: "Arithmetic, revealed",
    description: "Explore arithmetic, bitwise logic, shifts, status flags, and carry propagation one bit at a time.",
    color: "lime",
    icon: <Zap size={18} />,
  },
  {
    id: "pipeline",
    index: "02",
    title: "Pipeline",
    eyebrow: "Work in parallel",
    description: "Watch hazards, stalls, forwarding, and flushes unfold by cycle.",
    color: "blue",
    icon: <Layers3 size={18} />,
  },
  {
    id: "cache",
    index: "03",
    title: "Cache Lab",
    eyebrow: "Memory, accelerated",
    description: "Compare mapping strategies and see every hit, miss, and eviction.",
    color: "orange",
    icon: <MemoryStick size={18} />,
  },
  {
    id: "branch",
    index: "04",
    title: "Branch Predictor",
    eyebrow: "Guess the future",
    description: "Test prediction strategies and visualize the cost of being wrong.",
    color: "purple",
    icon: <BrainCircuit size={18} />,
  },
  {
    id: "builder",
    index: "05",
    title: "Build a CPU",
    eyebrow: "Connect the machine",
    description: "Choose an instruction challenge, place components, wire explicit buses, and diagnose an incomplete datapath.",
    color: "pink",
    icon: <Box size={18} />,
  },
  {
    id: "performance",
    index: "06",
    title: "Performance Lab",
    eyebrow: "Measure everything",
    description: "Tune real workloads and measure CPI, throughput, and cache behavior.",
    color: "teal",
    icon: <Gauge size={18} />,
  },
];

const GLOSSARIES: Record<LabId, Array<{ term: string; definition: string }>> = {
  alu: [
    { term: "ALU", definition: "Arithmetic Logic Unit: the CPU block that performs arithmetic, logic, comparison, and shift operations." },
    { term: "Operand", definition: "An input value supplied to an operation. This lab labels the two operands A and B." },
    { term: "Bitwise", definition: "An operation applied independently to corresponding bits, as in AND, OR, XOR, and NOT." },
    { term: "Full adder", definition: "A one-bit circuit that combines A, B, and carry-in to produce a sum and carry-out." },
    { term: "Ripple carry", definition: "An adder design where each bit's carry-out becomes the next bit's carry-in." },
    { term: "Two's complement", definition: "The standard signed-integer representation. Subtraction is performed by adding the inverted value plus one." },
    { term: "Logical shift", definition: "Moves every bit left or right and fills the newly opened position with zero." },
    { term: "Carry flag", definition: "Records a carry out of the most-significant bit, or the bit shifted out during a shift." },
    { term: "Overflow flag", definition: "Signals that a signed result cannot be represented in the available eight bits." },
    { term: "Zero / Negative flags", definition: "Status bits that report whether the result is zero or has its most-significant bit set." },
  ],
  pipeline: [
    { term: "Pipeline", definition: "A design that overlaps multiple instructions by dividing execution into stages." },
    { term: "IF / ID / EX / MEM / WB", definition: "Fetch, Decode, Execute, Memory, and Write Back: the five stages shown in the timeline." },
    { term: "RAW hazard", definition: "Read After Write: an instruction needs a value that an earlier instruction has not written yet." },
    { term: "Stall", definition: "A deliberate pause that keeps an instruction from advancing until its input is safe to use." },
    { term: "Forwarding", definition: "Routes a result directly from a later stage to an earlier stage without waiting for register write-back." },
    { term: "Bubble", definition: "An empty pipeline slot inserted by a stall." },
    { term: "Flush", definition: "Discards instructions already in the pipeline, commonly after a branch misprediction." },
    { term: "Latency", definition: "The total time or number of cycles required to complete work." },
    { term: "CPI", definition: "Cycles Per Instruction: total cycles divided by completed instructions." },
  ],
  cache: [
    { term: "Cache", definition: "Small, fast storage that keeps recently or frequently used memory blocks near the CPU." },
    { term: "Cache line", definition: "One entry in the cache containing metadata and a copied block of memory." },
    { term: "Tag", definition: "The upper address bits used to identify which memory block is stored in a cache line." },
    { term: "Index", definition: "Address bits that select a cache line or set." },
    { term: "Offset", definition: "Address bits that select a byte or word inside a cached block." },
    { term: "Hit / Miss", definition: "A hit finds the requested block in cache; a miss must fetch it from slower memory." },
    { term: "Eviction", definition: "Removal of an existing cache block to make room for a new one." },
    { term: "Direct mapped", definition: "Each memory block can occupy exactly one cache line." },
    { term: "Set associative", definition: "Each memory block maps to a set and may use any line inside that set." },
    { term: "Fully associative", definition: "A memory block may occupy any cache line." },
    { term: "LRU", definition: "Least Recently Used: a replacement policy that evicts the line used least recently." },
    { term: "AMAT", definition: "Average Memory Access Time, combining hit time with miss rate and miss penalty." },
  ],
  branch: [
    { term: "Branch", definition: "An instruction that may change the next program address based on a condition." },
    { term: "Taken", definition: "The branch changes control flow to its target instead of continuing sequentially." },
    { term: "Branch predictor", definition: "Hardware that guesses a branch outcome before the condition is fully resolved." },
    { term: "Static prediction", definition: "Uses a fixed rule and does not learn from previous outcomes." },
    { term: "1-bit predictor", definition: "Predicts the same outcome as the branch's most recent result." },
    { term: "2-bit saturating counter", definition: "A four-state predictor that requires two contrary outcomes to reverse a strong prediction." },
    { term: "Confidence state", definition: "The counter state indicating how strongly the predictor favors taken or not taken." },
    { term: "Misprediction", definition: "The predicted path differs from the branch's actual outcome." },
    { term: "Pipeline flush", definition: "Removes instructions fetched from the wrong path after a misprediction." },
  ],
  builder: [
    { term: "Datapath", definition: "The CPU components and connections that transport and transform instruction data." },
    { term: "Bus", definition: "A group of wires carrying a value or control information between components." },
    { term: "Program Counter (PC)", definition: "A register holding the address of the next instruction to fetch." },
    { term: "Instruction Memory", definition: "Storage containing the program's encoded instructions." },
    { term: "Decoder / Control Unit", definition: "Interprets the instruction and activates the control signals required by the datapath." },
    { term: "Register File", definition: "A small bank of CPU registers with read and write ports." },
    { term: "Multiplexer (MUX)", definition: "Selects one of several input values based on a control signal." },
    { term: "ALU", definition: "Performs the arithmetic or logic operation selected by the instruction." },
    { term: "Data Memory", definition: "Storage read by load instructions and written by store instructions." },
    { term: "Write-back", definition: "The connection that returns an ALU or memory result to the register file." },
    { term: "Control signal", definition: "A command from the decoder that selects an operation, input, or write destination." },
  ],
  performance: [
    { term: "Benchmark", definition: "A repeatable workload used to compare system performance." },
    { term: "Workload", definition: "The instruction mix and memory behavior of the program being measured." },
    { term: "Clock speed", definition: "The number of processor clock cycles per second, measured here in gigahertz." },
    { term: "Issue width", definition: "The maximum number of instructions a processor can begin in one cycle." },
    { term: "CPI", definition: "Cycles Per Instruction. Lower values generally indicate higher throughput." },
    { term: "IPC", definition: "Instructions Per Cycle. It is the reciprocal of CPI in this simplified model." },
    { term: "Cache hit rate", definition: "The percentage of memory requests satisfied by the cache." },
    { term: "Branch accuracy", definition: "The percentage of branch predictions that match actual outcomes." },
    { term: "Runtime", definition: "The estimated elapsed time: total cycles divided by clock frequency." },
    { term: "Bottleneck", definition: "The factor placing the strongest limit on current performance." },
  ],
};

const LAB_READINGS: Record<
  LabId,
  {
    title: string;
    paragraphs: string[];
    prompt: string;
  }
> = {
  alu: {
    title: "One result is really eight small decisions.",
    paragraphs: [
      "The binary rows at the top show the two input registers and the result register. When you step the circuit, the cursor begins at bit 0 and moves across one column at a time. Each card below is responsible for that same bit position, so the highlighted input, gate logic, carry, and result always describe one piece of the same calculation.",
      "Addition makes the dependency easiest to see: a bit can be resolved only after the carry from the previous bit is known. The other operations reuse the same eight-bit view to show that an ALU is not just an adder. It also performs Boolean logic, inversion, and shifts, then records useful facts about the result in its status flags.",
    ],
    prompt: "Try stepping through 255 + 1. Watch the carry travel through every column, then inspect which flags turn on when the eight-bit result wraps to zero.",
  },
  pipeline: {
    title: "The processor is doing several jobs at once.",
    paragraphs: [
      "Every row is an instruction and every column is a clock cycle. Moving diagonally across the grid shows how fetch, decode, execute, memory, and write-back overlap. That overlap is the source of pipeline throughput: a new instruction can begin before the previous one has finished.",
      "The complication is dependency. When an instruction needs a result that is still somewhere ahead of it, the hardware must forward that value or stop the dependent instruction. Toggle forwarding and move through the cycles to see how a single unavailable register becomes a bubble, then becomes extra CPI.",
    ],
    prompt: "Compare the same instruction sequence with forwarding on and off. Count the empty slots rather than only reading the final CPI.",
  },
  cache: {
    title: "Fast memory works by making a careful guess.",
    paragraphs: [
      "A cache assumes that recently used data, and data located nearby, will probably be needed again. Each address in the trace is split into fields that decide where its memory block may live. The cache grid then shows whether the required tag is already present, whether main memory must be consulted, and which old line is displaced.",
      "Changing the mapping strategy changes the number of legal homes for each block. Direct mapping is simple but can make unrelated addresses fight for the same line. Associativity gives the hardware more choices, at the cost of additional lookup and replacement logic.",
    ],
    prompt: "Use a repeating trace that maps several addresses to the same index. Then change associativity and watch conflict misses disappear or move.",
  },
  branch: {
    title: "The CPU must choose a path before it knows the answer.",
    paragraphs: [
      "A branch condition is often resolved after the fetch unit already needs another instruction address. Rather than wait, the predictor makes a guess and lets the pipeline continue. A correct guess hides that delay. A wrong guess means the speculative instructions came from the wrong path and must be flushed.",
      "The predictor state shows how hardware learns from a tiny amount of history. A one-bit predictor follows the last outcome immediately, while a two-bit counter needs repeated evidence before changing a strong opinion. Run different patterns and notice that no predictor is best for every kind of branch.",
    ],
    prompt: "Run the loop-exit pattern with a two-bit predictor. The final not-taken outcome is wrong, but the predictor does not immediately forget the repeated taken history.",
  },
  builder: {
    title: "A component is useful only when data can reach it.",
    paragraphs: [
      "This lab treats a CPU as a connected datapath rather than a collection of boxes. The selected challenge defines the journey an instruction must make. You choose the required components, but placement alone is not enough: explicit buses must carry instruction addresses, operands, results, and write-back data in the correct direction.",
      "The design checks are intentionally strict because real hardware is strict. A missing multiplexer input or write-back connection does not produce a nearly working processor. It produces a broken path. Once the checker can trace the complete route, run the signal and watch the instruction move through the machine you assembled.",
    ],
    prompt: "After completing a valid datapath, remove one bus near the end. Use the failed checks to reason backward and identify which earlier work can no longer reach its destination.",
  },
  performance: {
    title: "Performance is a balance, not a single fast number.",
    paragraphs: [
      "Clock speed tells only part of the story. A wider processor cannot sustain high throughput when cache misses keep it waiting, and an excellent cache cannot prevent wasted work after frequent branch mispredictions. This simplified model keeps those relationships visible while you tune one factor at a time.",
      "The dashboard translates your choices into IPC, CPI, runtime, and bottleneck pressure. The values are educational estimates rather than measurements of a specific commercial processor, but the cause and effect are real: performance comes from the interaction between workload behavior and microarchitecture.",
    ],
    prompt: "Choose a memory-heavy workload and raise issue width first. Then improve cache hit rate. The different response shows why optimizing the wrong bottleneck buys very little.",
  },
};

const clampByte = (value: number) => Math.max(0, Math.min(255, value || 0));
const byte = (value: number) => (value & 0xff).toString(2).padStart(8, "0");

export function ArchitectureLab({
  activeLab,
  onBack,
  onNavigate,
}: {
  activeLab: LabId;
  onBack: () => void;
  onNavigate: (lab: LabId) => void;
}) {
  const lab = LABS.find((item) => item.id === activeLab) ?? LABS[0];

  return (
    <div className={`lab-page lab-${lab.color}`}>
      <header className="lab-header">
        <button className="lab-brand" onClick={onBack} aria-label="Return to MicroVision home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span>microvision</span>
        </button>
        <nav className="lab-nav" aria-label="Architecture labs">
          {LABS.map((item) => (
            <button
              className={item.id === activeLab ? "active" : ""}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-label={`Open ${item.title}`}
            >
              {item.index}
            </button>
          ))}
        </nav>
        <button className="back-home" onClick={onBack}>
          <ArrowLeft size={15} /> All labs
        </button>
      </header>

      <main className="lab-main">
        <section className="lab-hero">
          <div>
            <span className="lab-index">{lab.index} / ARCHITECTURE LAB</span>
            <div className="lab-title-row">
              <span className="lab-title-icon">{lab.icon}</span>
              <h1>{lab.title}</h1>
            </div>
          </div>
          <div className="lab-intro">
            <span>{lab.eyebrow}</span>
            <p>{lab.description}</p>
          </div>
        </section>

        <section className="lab-workbench">
          {activeLab === "alu" && <AluExplorer />}
          {activeLab === "pipeline" && <PipelineLab />}
          {activeLab === "cache" && <CacheLab />}
          {activeLab === "branch" && <BranchLab />}
          {activeLab === "builder" && <CpuBuilder />}
          {activeLab === "performance" && <PerformanceLab />}
        </section>

        <LabReading lab={activeLab} />

        <KeywordGlossary lab={activeLab} />

        <section className="next-lab">
          <div>
            <span>KEEP EXPLORING</span>
            <strong>
              {LABS[(LABS.findIndex((item) => item.id === activeLab) + 1) % LABS.length].title}
            </strong>
          </div>
          <button
            onClick={() =>
              onNavigate(
                LABS[(LABS.findIndex((item) => item.id === activeLab) + 1) % LABS.length].id,
              )
            }
          >
            Next lab <ArrowRight size={17} />
          </button>
        </section>
      </main>
    </div>
  );
}

function LabReading({ lab }: { lab: LabId }) {
  const reading = LAB_READINGS[lab];

  return (
    <section className="lab-reading" aria-labelledby={`${lab}-reading-title`}>
      <div className="lab-reading-heading">
        <span>BEHIND THE VISUAL</span>
        <h2 id={`${lab}-reading-title`}>{reading.title}</h2>
      </div>
      <div className="lab-reading-copy">
        {reading.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <aside>
          <span>TRY THIS</span>
          <p>{reading.prompt}</p>
        </aside>
      </div>
    </section>
  );
}

function KeywordGlossary({ lab }: { lab: LabId }) {
  return (
    <section className="keyword-glossary" aria-labelledby="glossary-title">
      <div className="glossary-intro">
        <span>REFERENCE / KEYWORDS</span>
        <h2 id="glossary-title">Terms used on this page.</h2>
        <p>Short definitions for the architecture vocabulary used throughout this lab.</p>
      </div>
      <dl className="glossary-grid">
        {GLOSSARIES[lab].map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function WorkbenchHeader({
  label,
  status,
  actions,
}: {
  label: string;
  status: string;
  actions?: ReactNode;
}) {
  return (
    <div className="workbench-header">
      <div>
        <span className="workbench-dot" />
        <strong>{label}</strong>
        <small>{status}</small>
      </div>
      {actions && <div className="workbench-actions">{actions}</div>}
    </div>
  );
}

function NumberControl({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`number-control ${disabled ? "disabled-operand" : ""}`}>
      <span>{label}</span>
      <div>
        <button disabled={disabled} onClick={() => onChange(clampByte(value - 1))} aria-label={`Decrease ${label}`}>
          <Minus size={14} />
        </button>
        <input
          disabled={disabled}
          type="number"
          min="0"
          max="255"
          value={value}
          onChange={(event) => onChange(clampByte(Number(event.target.value)))}
        />
        <button disabled={disabled} onClick={() => onChange(clampByte(value + 1))} aria-label={`Increase ${label}`}>
          <Plus size={14} />
        </button>
      </div>
      <code>{byte(value)}</code>
    </label>
  );
}

type AluOperation = "ADD" | "SUB" | "AND" | "OR" | "XOR" | "NOT" | "SHL" | "SHR";

const ALU_OPERATIONS: Array<{
  id: AluOperation;
  name: string;
  symbol: string;
  description: string;
  usesRight: boolean;
}> = [
  { id: "ADD", name: "Add", symbol: "+", description: "Adds A and B using carry propagation.", usesRight: true },
  { id: "SUB", name: "Subtract", symbol: "−", description: "Adds A to the two's complement of B.", usesRight: true },
  { id: "AND", name: "Bitwise AND", symbol: "&", description: "Outputs 1 only when both input bits are 1.", usesRight: true },
  { id: "OR", name: "Bitwise OR", symbol: "|", description: "Outputs 1 when either input bit is 1.", usesRight: true },
  { id: "XOR", name: "Bitwise XOR", symbol: "⊕", description: "Outputs 1 when the input bits differ.", usesRight: true },
  { id: "NOT", name: "Bitwise NOT", symbol: "~", description: "Inverts every bit in A.", usesRight: false },
  { id: "SHL", name: "Shift left", symbol: "<<", description: "Moves bits left, inserts zero, and discards bit 7.", usesRight: false },
  { id: "SHR", name: "Shift right", symbol: ">>", description: "Moves bits right, inserts zero, and discards bit 0.", usesRight: false },
];

function BinaryWord({
  value,
  activeBit,
  reveal = false,
}: {
  value: number;
  activeBit: number;
  reveal?: boolean;
}) {
  return (
    <code
      className={`binary-word ${reveal ? "result" : ""}`}
      aria-label={reveal && activeBit < 0 ? "Result pending" : byte(value)}
    >
      {byte(value).split("").map((digit, index) => {
        const bit = 7 - index;
        const isCurrent = bit === activeBit;
        const isRevealed = !reveal || (activeBit >= 0 && bit <= activeBit);

        return (
          <span
            className={`${isCurrent ? "current" : ""} ${
              reveal ? (isRevealed ? "revealed" : "pending") : ""
            }`}
            key={bit}
          >
            {reveal ? (isRevealed ? digit : "·") : digit}
          </span>
        );
      })}
    </code>
  );
}

function AluExplorer() {
  const [left, setLeft] = useState(10);
  const [right, setRight] = useState(20);
  const [operation, setOperation] = useState<AluOperation>("ADD");
  const [activeBit, setActiveBit] = useState(-1);
  const [running, setRunning] = useState(false);
  const operationMeta = ALU_OPERATIONS.find((item) => item.id === operation)!;

  const calculation = useMemo(() => {
    let raw = 0;
    if (operation === "ADD") raw = left + right;
    if (operation === "SUB") raw = left - right;
    if (operation === "AND") raw = left & right;
    if (operation === "OR") raw = left | right;
    if (operation === "XOR") raw = left ^ right;
    if (operation === "NOT") raw = ~left;
    if (operation === "SHL") raw = left << 1;
    if (operation === "SHR") raw = left >>> 1;

    const result = raw & 0xff;
    const carry =
      operation === "ADD"
        ? raw > 255
        : operation === "SUB"
          ? left >= right
          : operation === "SHL"
            ? Boolean(left & 0x80)
            : operation === "SHR"
              ? Boolean(left & 0x01)
              : false;
    const overflow =
      operation === "ADD"
        ? Boolean((~(left ^ right) & (left ^ result) & 0x80))
        : operation === "SUB"
          ? Boolean(((left ^ right) & (left ^ result) & 0x80))
          : false;

    let carryState = operation === "SUB" ? 1 : 0;
    const bits = Array.from({ length: 8 }, (_, bit) => {
      const a = (left >> bit) & 1;
      const b = (right >> bit) & 1;
      const bInput = operation === "SUB" ? b ^ 1 : b;
      const carryIn = carryState;
      let output = 0;
      let carryOut = 0;

      if (operation === "ADD" || operation === "SUB") {
        output = a ^ bInput ^ carryIn;
        carryOut = (a & bInput) | (carryIn & (a ^ bInput));
        carryState = carryOut;
      }
      if (operation === "AND") output = a & b;
      if (operation === "OR") output = a | b;
      if (operation === "XOR") output = a ^ b;
      if (operation === "NOT") output = a ^ 1;
      if (operation === "SHL") output = bit === 0 ? 0 : (left >> (bit - 1)) & 1;
      if (operation === "SHR") output = bit === 7 ? 0 : (left >> (bit + 1)) & 1;

      return { bit, a, b, bInput, carryIn, output, carryOut };
    });

    return { raw, result, carry, overflow, bits };
  }, [left, operation, right]);

  const isArithmetic = operation === "ADD" || operation === "SUB";
  const equation = operationMeta.usesRight
    ? `${left} ${operationMeta.symbol} ${right} = ${calculation.result}`
    : `${operationMeta.symbol}${left} = ${calculation.result}`;
  const activeCell = calculation.bits[Math.max(activeBit, 0)];

  const reset = () => {
    setLeft(10);
    setRight(20);
    setOperation("ADD");
    setActiveBit(-1);
    setRunning(false);
  };

  const step = () => {
    setRunning(false);
    setActiveBit((value) => (value < 0 || value >= 7 ? 0 : value + 1));
  };

  useEffect(() => {
    if (!running) return;
    if (activeBit >= 7) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setActiveBit((value) => value + 1), 420);
    return () => window.clearTimeout(timer);
  }, [activeBit, running]);

  const run = () => {
    if (running) {
      setRunning(false);
      return;
    }
    if (activeBit < 0 || activeBit >= 7) setActiveBit(0);
    setRunning(true);
  };

  const inspectorEquation = isArithmetic
    ? `${activeCell.a} XOR ${activeCell.bInput} XOR ${activeCell.carryIn} = ${activeCell.output}`
    : operation === "NOT"
      ? `NOT ${activeCell.a} = ${activeCell.output}`
      : operation === "SHL" || operation === "SHR"
        ? `Shifted source → ${activeCell.output}`
        : `${activeCell.a} ${operationMeta.symbol} ${activeCell.b} = ${activeCell.output}`;

  return (
    <>
      <WorkbenchHeader
        label="8-BIT ARITHMETIC LOGIC UNIT"
        status={
          activeBit < 0
            ? `${operationMeta.name} selected · result register clear`
            : `${operationMeta.name} · resolving bit ${activeBit}`
        }
        actions={
          <>
            <button onClick={reset}><RotateCcw size={14} /> Reset</button>
            <button onClick={step}><StepForward size={14} /> Step bit</button>
            <button className="lab-run" onClick={run}>
              {running ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {running ? "Pause" : "Run bits"}
            </button>
          </>
        }
      />
      <div className="alu-layout">
        <aside className="lab-controls">
          <span className="control-label">OPERATION</span>
          <div className="alu-operation-grid">
            {ALU_OPERATIONS.map((item) => (
              <button
                className={operation === item.id ? "active" : ""}
                key={item.id}
                onClick={() => {
                  setOperation(item.id);
                  setActiveBit(-1);
                  setRunning(false);
                }}
              >
                <strong>{item.id}</strong>
                <span>{item.symbol}</span>
              </button>
            ))}
          </div>
          <span className="control-label operand-heading">OPERANDS</span>
          <NumberControl label="INPUT A" value={left} onChange={(value) => { setLeft(value); setActiveBit(-1); setRunning(false); }} />
          <NumberControl label="INPUT B" value={right} onChange={(value) => { setRight(value); setActiveBit(-1); setRunning(false); }} disabled={!operationMeta.usesRight} />
          <div className="equation-card">
            <span>DECIMAL RESULT</span>
            <strong>{equation}</strong>
            <small>{operationMeta.description}</small>
          </div>
          <div className="flag-list" aria-label="ALU status flags">
            <span className={calculation.result === 0 ? "on" : ""}>Z · ZERO</span>
            <span className={calculation.result >= 128 ? "on" : ""}>N · NEGATIVE</span>
            <span className={calculation.carry ? "on" : ""}>C · CARRY</span>
            <span className={calculation.overflow ? "on" : ""}>V · OVERFLOW</span>
          </div>
        </aside>

        <div className="adder-stage">
          <div className="binary-equation">
            <span>A</span><BinaryWord value={left} activeBit={activeBit} />
            {operationMeta.usesRight && <><span>B</span><BinaryWord value={right} activeBit={activeBit} /></>}
            <span>OP</span><code className="operation-code">{operationMeta.name.toUpperCase()}</code>
            <i />
            <span>R</span><BinaryWord value={calculation.result} activeBit={activeBit} reveal />
          </div>
          <div className="bit-labels">
            {calculation.bits.slice().reverse().map(({ bit }) => <span key={bit}>BIT {bit}</span>)}
          </div>
          <div className={`adder-chain ${running ? "running" : ""}`}>
            {calculation.bits.map((cell) => (
              <button
                className={`full-adder ${cell.bit <= activeBit ? "active" : ""} ${
                  cell.bit === activeBit ? "current" : ""
                }`}
                key={cell.bit}
                onClick={() => {
                  setRunning(false);
                  setActiveBit(cell.bit);
                }}
                aria-label={`Inspect bit ${cell.bit}`}
              >
                <span className="carry-in">
                  {isArithmetic ? `CARRY IN ${cell.carryIn}` : `BIT ${cell.bit}`}
                </span>
                <div className="gate-row">
                  <span className={cell.a ? "hot" : ""}>A {cell.a}</span>
                  <b>{operationMeta.symbol}</b>
                  <span className={operationMeta.usesRight && cell.b ? "hot" : ""}>
                    {operationMeta.usesRight ? `B ${cell.b}` : "—"}
                  </span>
                </div>
                <strong>{isArithmetic ? <>FULL<br />ADDER</> : operationMeta.id}</strong>
                <div className="gate-row output">
                  <span className={cell.output ? "hot" : ""}>OUT {cell.output}</span>
                  <b>·</b>
                  <span className={isArithmetic && cell.carryOut ? "hot" : ""}>
                    {isArithmetic ? `CARRY ${cell.carryOut}` : "1 BIT"}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="gate-inspector">
            <div>
              <span>
                {activeBit < 0
                  ? "BIT CURSOR READY"
                  : `INSPECTING BIT ${activeBit} · ${operationMeta.name.toUpperCase()}`}
              </span>
              <strong>
                {activeBit < 0 ? "Press Step bit or Run bits to begin" : inspectorEquation}
              </strong>
            </div>
            <p>
              {activeBit < 0
                ? "Inputs are loaded. The result register will fill from bit 0 to bit 7 as each gate column resolves."
                : isArithmetic
                ? operation === "SUB"
                  ? `B is inverted and the initial carry-in is 1. This implements A + NOT B + 1, the two's-complement form of subtraction.`
                  : `Carry-out ${activeCell.carryOut} becomes the carry-in for the next bit, creating the ripple-carry path.`
                : operationMeta.description}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const PIPELINE_INSTRUCTIONS = [
  { id: "I1", code: "LW R1, 0(R2)", hazard: false },
  { id: "I2", code: "ADD R3, R1, R4", hazard: true },
  { id: "I3", code: "SUB R5, R3, R6", hazard: true },
  { id: "I4", code: "SW R5, 4(R2)", hazard: true },
];

function pipelineStage(row: number, cycle: number, forwarding: boolean) {
  const stages = ["IF", "ID", "EX", "MEM", "WB"];
  const position = cycle - row - 1;
  if (position < 0) return "";
  if (!forwarding && row >= 1) {
    if (position === 1) return "STALL";
    if (position > 1) return stages[position - 1] ?? "";
  }
  return stages[position] ?? "";
}

function PipelineLab() {
  const [cycle, setCycle] = useState(1);
  const [forwarding, setForwarding] = useState(false);
  const [running, setRunning] = useState(false);
  const maxCycle = forwarding ? 8 : 9;
  const hazardActive = cycle >= 3 && cycle <= 6;
  const currentActivity = PIPELINE_INSTRUCTIONS
    .map((instruction, row) => ({ ...instruction, stage: pipelineStage(row, cycle, forwarding) }))
    .filter((instruction) => instruction.stage);
  const cycleEvent = currentActivity.some((instruction) => instruction.stage === "STALL")
    ? "Hazard unit freezes decode and inserts a bubble."
    : forwarding && hazardActive
      ? "Forwarding network bypasses a result into the next execute stage."
      : currentActivity.some((instruction) => instruction.stage === "WB")
        ? "A completed result is committed to the register file."
        : "Instructions advance one stage on this clock edge.";

  useEffect(() => {
    if (!running) return;
    if (cycle >= maxCycle) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setCycle((value) => Math.min(maxCycle, value + 1)), 650);
    return () => window.clearTimeout(timer);
  }, [cycle, maxCycle, running]);

  return (
    <>
      <WorkbenchHeader
        label="5-STAGE RISC PIPELINE"
        status={`Cycle ${cycle} of ${maxCycle} · ${forwarding ? "Forwarding enabled" : "Stall on RAW hazard"}`}
        actions={
          <>
            <button onClick={() => { setCycle(1); setRunning(false); }}><RotateCcw size={14} /> Reset</button>
            <button onClick={() => { setRunning(false); setCycle((value) => Math.min(maxCycle, value + 1)); }}>
              <StepForward size={14} /> Next cycle
            </button>
            <button className="lab-run" onClick={() => {
              if (!running && cycle >= maxCycle) setCycle(1);
              setRunning((value) => !value);
            }}>
              {running ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {running ? "Pause" : "Run"}
            </button>
          </>
        }
      />
      <div className="pipeline-layout">
        <aside className="lab-controls">
          <span className="control-label">HAZARD UNIT</span>
          <button
            className={`toggle-control ${forwarding ? "on" : ""}`}
            onClick={() => {
              setForwarding((value) => !value);
              setCycle(1);
              setRunning(false);
            }}
          >
            <span><i /></span>
            Data forwarding
          </button>
          <div className={`hazard-alert ${hazardActive ? "visible" : ""}`}>
            <CircleDot size={17} />
            <div>
              <strong>RAW HAZARD</strong>
              <small>I2 needs R1 before I1 writes it.</small>
            </div>
          </div>
          <div className="pipeline-legend">
            {["IF Fetch", "ID Decode", "EX Execute", "MEM Memory", "WB Write back"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </aside>
        <div className="pipeline-stage">
          <div className="cycle-scrubber">
            <span>CYCLE</span>
            <input
              aria-label="Pipeline cycle"
              type="range"
              min="1"
              max={maxCycle}
              value={cycle}
              onChange={(event) => { setCycle(Number(event.target.value)); setRunning(false); }}
            />
            <strong>{String(cycle).padStart(2, "0")}</strong>
          </div>
          <div className={`pipeline-event ${hazardActive ? "hazard" : ""}`}>
            <div>
              <span>CLOCK EDGE {String(cycle).padStart(2, "0")}</span>
              <strong>{cycleEvent}</strong>
            </div>
            <div className="pipeline-activity">
              {currentActivity.map((instruction) => (
                <span className={`pipe-${instruction.stage.toLowerCase()}`} key={instruction.id}>
                  <b>{instruction.id}</b>{instruction.stage}
                </span>
              ))}
            </div>
          </div>
          <div className="pipeline-table">
            <div className="pipeline-row pipeline-head">
              <span>INSTRUCTION</span>
              {Array.from({ length: maxCycle }, (_, index) => <span key={index}>{index + 1}</span>)}
            </div>
            {PIPELINE_INSTRUCTIONS.map((instruction, row) => (
              <div className="pipeline-row" key={instruction.id}>
                <span><b>{instruction.id}</b>{instruction.code}</span>
                {Array.from({ length: maxCycle }, (_, index) => {
                  const stage = pipelineStage(row, index + 1, forwarding);
                  return (
                    <span
                      className={`${stage ? `pipe-${stage.toLowerCase()}` : ""} ${
                        index + 1 === cycle && stage ? "current" : ""
                      } ${index + 1 > cycle ? "future" : ""}`}
                      key={index}
                    >
                      {stage === "STALL" ? "●" : stage}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="pipeline-summary">
            <div><span>LATENCY</span><strong>{maxCycle} cycles</strong></div>
            <div><span>STALLS</span><strong>{forwarding ? 0 : 3}</strong></div>
            <div><span>CPI</span><strong>{(maxCycle / 4).toFixed(2)}</strong></div>
            <p>
              {forwarding
                ? "Results bypass the register file and feed the next ALU operation directly."
                : "The hazard unit freezes fetch and decode until the required value is available."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

type CacheLine = { tag: number | null; address: number | null; age: number };
type CacheAccess = {
  address: number;
  line: number;
  result: "HIT" | "MISS" | "EVICT";
  evicted: number | null;
};

function CacheLab() {
  const [mapping, setMapping] = useState<"direct" | "2-way" | "fully">("direct");
  const [trace, setTrace] = useState([10, 20, 10, 42, 74, 20, 106, 10]);
  const [pointer, setPointer] = useState(0);
  const [lines, setLines] = useState<CacheLine[]>(
    Array.from({ length: 4 }, () => ({ tag: null, address: null, age: 0 })),
  );
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [lastResult, setLastResult] = useState<"HIT" | "MISS" | "EVICT" | null>(null);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [history, setHistory] = useState<CacheAccess[]>([]);
  const [running, setRunning] = useState(false);

  const reset = (nextMapping = mapping) => {
    setMapping(nextMapping);
    setPointer(0);
    setLines(Array.from({ length: 4 }, () => ({ tag: null, address: null, age: 0 })));
    setHits(0);
    setMisses(0);
    setLastResult(null);
    setActiveLine(null);
    setHistory([]);
    setRunning(false);
  };

  const access = useCallback(() => {
    if (pointer >= trace.length) return;
    const address = trace[pointer];
    let index = address % 4;
    if (mapping === "2-way") {
      const setStart = (address % 2) * 2;
      const hitIndex = lines.findIndex(
        (line, lineIndex) =>
          line.address === address && lineIndex >= setStart && lineIndex < setStart + 2,
      );
      index = hitIndex >= 0
        ? hitIndex
        : lines[setStart].address === null
          ? setStart
          : lines[setStart + 1].address === null
            ? setStart + 1
            : lines[setStart].age <= lines[setStart + 1].age
              ? setStart
              : setStart + 1;
    }
    if (mapping === "fully") {
      const hitIndex = lines.findIndex((line) => line.address === address);
      const emptyIndex = lines.findIndex((line) => line.address === null);
      index = hitIndex >= 0
        ? hitIndex
        : emptyIndex >= 0
          ? emptyIndex
          : lines.reduce((oldest, line, lineIndex) => line.age < lines[oldest].age ? lineIndex : oldest, 0);
    }

    const hit = lines[index].address === address;
    const eviction = !hit && lines[index].address !== null;
    const result = hit ? "HIT" : eviction ? "EVICT" : "MISS";
    const evicted = eviction ? lines[index].address : null;
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? { tag: Math.floor(address / 4), address, age: pointer + 1 }
          : line,
      ),
    );
    setActiveLine(index);
    setLastResult(result);
    setHistory((items) => [...items.slice(-5), { address, line: index, result, evicted }]);
    hit ? setHits((value) => value + 1) : setMisses((value) => value + 1);
    setPointer((value) => value + 1);
  }, [lines, mapping, pointer, trace]);

  useEffect(() => {
    if (!running) return;
    if (pointer >= trace.length) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(access, 600);
    return () => window.clearTimeout(timer);
  }, [access, pointer, running, trace.length]);

  const total = hits + misses;

  return (
    <>
      <WorkbenchHeader
        label="L1 DATA CACHE"
        status={`${mapping.toUpperCase()} · 4 lines · 1 word blocks`}
        actions={
          <>
            <button onClick={() => reset()}><RotateCcw size={14} /> Reset</button>
            <button onClick={() => { setRunning(false); access(); }} disabled={pointer >= trace.length}>
              <StepForward size={13} /> Step
            </button>
            <button className="lab-run" onClick={() => setRunning((value) => !value)} disabled={pointer >= trace.length}>
              {running ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {running ? "Pause" : "Run trace"}
            </button>
          </>
        }
      />
      <div className="cache-layout">
        <aside className="lab-controls">
          <span className="control-label">MAPPING STRATEGY</span>
          <div className="segmented">
            {(["direct", "2-way", "fully"] as const).map((mode) => (
              <button className={mapping === mode ? "active" : ""} key={mode} onClick={() => reset(mode)}>
                {mode}
              </button>
            ))}
          </div>
          <label className="trace-input">
            <span>ADDRESS TRACE</span>
            <input
              value={trace.join(", ")}
              onChange={(event) => {
                const values = event.target.value
                  .split(",")
                  .map((item) => Number(item.trim()))
                  .filter((item) => Number.isFinite(item) && item >= 0);
                if (values.length) {
                  setTrace(values);
                  setPointer(0);
                  setLines(Array.from({ length: 4 }, () => ({ tag: null, address: null, age: 0 })));
                  setHits(0);
                  setMisses(0);
                  setLastResult(null);
                  setActiveLine(null);
                  setHistory([]);
                  setRunning(false);
                }
              }}
            />
          </label>
          <div className="trace-chips">
            {trace.map((address, index) => (
              <span className={index === pointer ? "current" : index < pointer ? "done" : ""} key={index}>
                {address}
              </span>
            ))}
          </div>
          <div className={`cache-result ${lastResult?.toLowerCase() ?? ""}`}>
            <span>LAST ACCESS</span>
            <strong>{lastResult ?? "—"}</strong>
          </div>
        </aside>
        <div className="cache-stage">
          <div className="address-breakdown">
            <div><span>ADDRESS</span><strong>{trace[pointer] ?? "DONE"}</strong></div>
            <ArrowRight size={20} />
            <div><span>TAG</span><strong>{pointer < trace.length ? Math.floor(trace[pointer] / 4) : "—"}</strong></div>
            <div><span>INDEX</span><strong>{pointer < trace.length ? trace[pointer] % 4 : "—"}</strong></div>
            <div><span>OFFSET</span><strong>0</strong></div>
          </div>
          <div className="cache-array">
            <div className="cache-row cache-head">
              <span>LINE</span><span>VALID</span><span>TAG</span><span>BLOCK</span><span>LRU AGE</span>
            </div>
            {lines.map((line, index) => (
              <div className={`cache-row ${activeLine === index ? "active" : ""}`} key={index}>
                <span>{String(index).padStart(2, "0")}</span>
                <span className={line.address !== null ? "valid" : ""}>{line.address !== null ? "1" : "0"}</span>
                <span>{line.tag ?? "—"}</span>
                <strong>{line.address ?? "EMPTY"}</strong>
                <span>{line.age || "—"}</span>
              </div>
            ))}
          </div>
          <div className="cache-access-log">
            <div className="history-head">
              <span>ACCESS BUS</span>
              <strong>{running ? "streaming trace" : `${pointer} / ${trace.length} resolved`}</strong>
            </div>
            <div>
              {history.length === 0 && <small>Step or run the trace to watch addresses map into cache lines.</small>}
              {history.map((item, index) => (
                <span className={item.result.toLowerCase()} key={`${item.address}-${index}`}>
                  <b>{item.address}</b>
                  <i>LINE {item.line}</i>
                  <strong>{item.result}</strong>
                  <small>{item.evicted === null ? "no eviction" : `evicted ${item.evicted}`}</small>
                </span>
              ))}
            </div>
          </div>
          <div className="cache-metrics">
            <div><span>HITS</span><strong>{hits}</strong></div>
            <div><span>MISSES</span><strong>{misses}</strong></div>
            <div><span>HIT RATE</span><strong>{total ? `${Math.round((hits / total) * 100)}%` : "—"}</strong></div>
            <div><span>AMAT</span><strong>{total ? `${(1 + (misses / total) * 80).toFixed(1)} ns` : "—"}</strong></div>
          </div>
        </div>
      </div>
    </>
  );
}

type BranchPattern = "loop" | "alternating" | "mostly-not";

const BRANCH_PATTERNS: Record<BranchPattern, { label: string; outcomes: boolean[] }> = {
  loop: { label: "Loop exit", outcomes: [true, true, true, true, false] },
  alternating: { label: "Alternating", outcomes: [true, false, true, false, true, false] },
  "mostly-not": { label: "Mostly not", outcomes: [false, false, true, false, false, false] },
};

function BranchLab() {
  const [mode, setMode] = useState<"static" | "one" | "two">("two");
  const [counter, setCounter] = useState(2);
  const [history, setHistory] = useState<Array<{ prediction: boolean; actual: boolean; correct: boolean }>>([]);
  const [pattern, setPattern] = useState<BranchPattern>("loop");
  const [patternIndex, setPatternIndex] = useState(0);
  const [running, setRunning] = useState(false);

  const prediction = mode === "static" ? true : mode === "one" ? counter >= 2 : counter >= 2;
  const record = useCallback((actual: boolean) => {
    const correct = prediction === actual;
    setHistory((items) => [...items.slice(-11), { prediction, actual, correct }]);
    if (mode === "one") setCounter(actual ? 3 : 0);
    if (mode === "two") setCounter((value) => Math.max(0, Math.min(3, value + (actual ? 1 : -1))));
  }, [mode, prediction]);
  const correct = history.filter((item) => item.correct).length;
  const lastBranch = history.at(-1);
  const patternMeta = BRANCH_PATTERNS[pattern];

  useEffect(() => {
    if (!running) return;
    if (history.length >= 12) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => {
      record(patternMeta.outcomes[patternIndex % patternMeta.outcomes.length]);
      setPatternIndex((value) => value + 1);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [history.length, patternIndex, patternMeta.outcomes, record, running]);

  const resetBranch = () => {
    setCounter(2);
    setHistory([]);
    setPatternIndex(0);
    setRunning(false);
  };

  return (
    <>
      <WorkbenchHeader
        label="DYNAMIC BRANCH PREDICTOR"
        status={`${mode === "two" ? "2-bit saturating counter" : mode === "one" ? "1-bit last outcome" : "Static taken"}`}
        actions={
          <>
            <button onClick={resetBranch}><RotateCcw size={14} /> Reset</button>
            <button className="lab-run" onClick={() => {
              if (!running && history.length >= 12) resetBranch();
              setRunning((value) => !value);
            }}>
              {running ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {running ? "Pause" : "Run pattern"}
            </button>
          </>
        }
      />
      <div className="branch-layout">
        <aside className="lab-controls">
          <span className="control-label">PREDICTOR</span>
          <div className="predictor-options">
            {[
              ["static", "Static taken"],
              ["one", "1-bit predictor"],
              ["two", "2-bit counter"],
            ].map(([value, label]) => (
              <button
                className={mode === value ? "active" : ""}
                key={value}
                onClick={() => { setMode(value as typeof mode); resetBranch(); }}
              >
                <CircleDot size={14} /> {label}
              </button>
            ))}
          </div>
          <div className="branch-code">
            <span>BRANCH AT 0x3C</span>
            <code>if (x &gt; 10) goto LOOP</code>
          </div>
          <span className="control-label branch-pattern-label">OUTCOME PATTERN</span>
          <div className="branch-patterns">
            {(Object.entries(BRANCH_PATTERNS) as Array<[BranchPattern, typeof patternMeta]>).map(([id, item]) => (
              <button
                className={pattern === id ? "active" : ""}
                key={id}
                onClick={() => { setPattern(id); resetBranch(); }}
              >
                <strong>{item.label}</strong>
                <code>{item.outcomes.map((outcome) => outcome ? "T" : "N").join(" ")}</code>
              </button>
            ))}
          </div>
          <p className="control-note">Resolve one outcome manually or run a pattern and watch the predictor learn.</p>
        </aside>
        <div className="branch-stage">
          <div className="prediction-display">
            <div>
              <span>NEXT PREDICTION</span>
              <strong className={prediction ? "taken" : "not-taken"}>
                {prediction ? "TAKEN" : "NOT TAKEN"}
              </strong>
              <small>Confidence state {counter} / 3</small>
            </div>
            <div className="counter-gauge">
              {["SNT", "WNT", "WT", "ST"].map((label, index) => (
                <span className={index === counter ? "active" : index < counter ? "passed" : ""} key={label}>
                  <i />{label}
                </span>
              ))}
            </div>
          </div>
          <div className="actual-controls">
            <span>WHAT ACTUALLY HAPPENS?</span>
            <div>
              <button onClick={() => { setRunning(false); record(true); }}><ArrowRight size={18} /> Taken</button>
              <button onClick={() => { setRunning(false); record(false); }}><ArrowRight size={18} /> Not taken</button>
            </div>
          </div>
          <div className={`branch-resolution ${lastBranch ? (lastBranch.correct ? "correct" : "wrong") : ""}`}>
            <div>
              <span>SPECULATIVE PATH</span>
              <strong>{lastBranch ? (lastBranch.prediction ? "FETCH TARGET" : "FETCH NEXT") : "WAITING"}</strong>
            </div>
            <ArrowRight size={18} />
            <div>
              <span>BRANCH RESOLVES</span>
              <strong>{lastBranch ? (lastBranch.actual ? "TAKEN" : "NOT TAKEN") : "—"}</strong>
            </div>
            <ArrowRight size={18} />
            <div>
              <span>PIPELINE ACTION</span>
              <strong>{lastBranch ? (lastBranch.correct ? "KEEP WORK" : "FLUSH 5 STAGES") : "—"}</strong>
            </div>
          </div>
          <div className="branch-history">
            <div className="history-head">
              <span>RECENT BRANCHES</span>
              <strong>{history.length ? `${Math.round((correct / history.length) * 100)}% accuracy` : "No samples"}</strong>
            </div>
            <div className="history-cells">
              {Array.from({ length: 12 }, (_, index) => {
                const item = history[index];
                return (
                  <span className={item ? (item.correct ? "correct" : "wrong") : ""} key={index}>
                    {item ? (item.actual ? "T" : "N") : "—"}
                    {item && <small>{item.correct ? "✓" : "×"}</small>}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="branch-cost">
            <div><span>CORRECT</span><strong>{correct}</strong></div>
            <div><span>MISPREDICTIONS</span><strong>{history.length - correct}</strong></div>
            <div><span>CYCLES LOST</span><strong>{(history.length - correct) * 5}</strong></div>
            <p>A wrong prediction flushes five in-flight stages before fetching from the correct address.</p>
          </div>
        </div>
      </div>
    </>
  );
}

const CPU_COMPONENTS = [
  { id: "pc", label: "Program Counter", short: "PC", purpose: "Supplies the next instruction address." },
  { id: "imem", label: "Instruction Memory", short: "I-MEM", purpose: "Returns the instruction stored at the PC." },
  { id: "decoder", label: "Decoder", short: "CTRL", purpose: "Generates datapath control signals." },
  { id: "registers", label: "Register File", short: "REGS", purpose: "Reads operands and receives write-back." },
  { id: "mux", label: "Multiplexer", short: "MUX", purpose: "Selects the ALU's second input." },
  { id: "alu", label: "ALU", short: "ALU", purpose: "Executes arithmetic and address calculations." },
  { id: "memory", label: "Data Memory", short: "RAM", purpose: "Stores data used by load and store instructions." },
] as const;

type CpuComponentId = typeof CPU_COMPONENTS[number]["id"];
type BuilderChallengeId = "arithmetic" | "load";

const BUILDER_CHALLENGES: Record<
  BuilderChallengeId,
  {
    title: string;
    instruction: string;
    objective: string;
    requiredNodes: CpuComponentId[];
    requiredEdges: string[];
    flow: CpuComponentId[];
  }
> = {
  arithmetic: {
    title: "Arithmetic datapath",
    instruction: "ADD R3, R1, R2",
    objective: "Fetch and decode an ADD, route two register operands through the ALU, then write the result back.",
    requiredNodes: ["pc", "imem", "decoder", "registers", "mux", "alu"],
    requiredEdges: [
      "pc>imem",
      "imem>decoder",
      "decoder>registers",
      "decoder>mux",
      "registers>mux",
      "mux>alu",
      "alu>registers",
    ],
    flow: ["pc", "imem", "decoder", "registers", "mux", "alu", "registers"],
  },
  load: {
    title: "Load datapath",
    instruction: "LOAD R3, [R1 + 4]",
    objective: "Calculate an address, read data memory, and return the loaded value to the register file.",
    requiredNodes: ["pc", "imem", "decoder", "registers", "mux", "alu", "memory"],
    requiredEdges: [
      "pc>imem",
      "imem>decoder",
      "decoder>registers",
      "decoder>mux",
      "registers>mux",
      "mux>alu",
      "alu>memory",
      "memory>registers",
    ],
    flow: ["pc", "imem", "decoder", "registers", "mux", "alu", "memory", "registers"],
  },
};

function CpuBuilder() {
  const [challengeId, setChallengeId] = useState<BuilderChallengeId>("arithmetic");
  const [components, setComponents] = useState<CpuComponentId[]>(["pc", "imem"]);
  const [edges, setEdges] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<CpuComponentId | null>(null);
  const [testResult, setTestResult] = useState<"idle" | "pass" | "fail">("idle");
  const [testMessage, setTestMessage] = useState("Place components, then click a source block and a destination block to create each bus.");
  const [executionStep, setExecutionStep] = useState(-1);
  const [executing, setExecuting] = useState(false);
  const challenge = BUILDER_CHALLENGES[challengeId];
  const missingNodes = challenge.requiredNodes.filter((component) => !components.includes(component));
  const missingEdges = challenge.requiredEdges.filter((edge) => !edges.includes(edge));
  const incorrectEdges = edges.filter((edge) => !challenge.requiredEdges.includes(edge));

  const componentFor = (id: string) => CPU_COMPONENTS.find((item) => item.id === id)!;
  const edgeLabel = (edge: string) => {
    const [from, to] = edge.split(">");
    return `${componentFor(from).short} → ${componentFor(to).short}`;
  };

  const reset = (nextChallenge = challengeId) => {
    setChallengeId(nextChallenge);
    setComponents(["pc", "imem"]);
    setEdges([]);
    setSelectedSource(null);
    setTestResult("idle");
    setTestMessage("Place components, then click a source block and a destination block to create each bus.");
    setExecutionStep(-1);
    setExecuting(false);
  };

  const addComponent = (id: CpuComponentId) => {
    if (!components.includes(id)) {
      setComponents((items) => [...items, id]);
      setTestMessage(`${componentFor(id).short} placed. Select it and another block to create a directed bus.`);
    }
    setTestResult("idle");
    setExecutionStep(-1);
    setExecuting(false);
  };

  const removeComponent = (id: CpuComponentId) => {
    setComponents((items) => items.filter((item) => item !== id));
    setEdges((items) => items.filter((edge) => !edge.startsWith(`${id}>`) && !edge.endsWith(`>${id}`)));
    if (selectedSource === id) setSelectedSource(null);
    setTestResult("idle");
    setTestMessage(`${componentFor(id).short} removed with its attached buses.`);
    setExecutionStep(-1);
    setExecuting(false);
  };

  const selectNode = (id: CpuComponentId) => {
    if (!selectedSource) {
      setSelectedSource(id);
      setTestMessage(`${componentFor(id).short} output selected. Now choose the component that should receive its value or control signal.`);
      return;
    }
    if (selectedSource === id) {
      setSelectedSource(null);
      setTestMessage("Connection selection cancelled.");
      return;
    }

    const edge = `${selectedSource}>${id}`;
    if (!edges.includes(edge)) {
      setEdges((items) => [...items, edge]);
      setTestMessage(`Connected ${componentFor(selectedSource).short} to ${componentFor(id).short}.`);
    } else {
      setTestMessage("That bus already exists.");
    }
    setSelectedSource(null);
    setTestResult("idle");
    setExecutionStep(-1);
    setExecuting(false);
  };

  const testCpu = () => {
    if (missingNodes.length) {
      setTestResult("fail");
      setTestMessage(`Missing components: ${missingNodes.map((id) => componentFor(id).short).join(", ")}.`);
      setExecutionStep(-1);
      setExecuting(false);
      return;
    }
    if (incorrectEdges.length) {
      setTestResult("fail");
      setTestMessage(`Incorrect bus${incorrectEdges.length > 1 ? "es" : ""}: ${incorrectEdges.map(edgeLabel).join(", ")}.`);
      setExecutionStep(-1);
      setExecuting(false);
      return;
    }
    if (missingEdges.length) {
      setTestResult("fail");
      setTestMessage(`The path is incomplete. ${missingEdges.length} required bus${missingEdges.length > 1 ? "es are" : " is"} still missing.`);
      setExecutionStep(-1);
      setExecuting(false);
      return;
    }
    setTestResult("pass");
    setTestMessage(`${challenge.instruction} can travel through every required stage and return its result correctly.`);
    setExecutionStep(0);
    setExecuting(false);
  };

  useEffect(() => {
    if (!executing || testResult !== "pass") return;
    if (executionStep >= challenge.flow.length - 1) {
      setExecuting(false);
      return;
    }
    const timer = window.setTimeout(() => setExecutionStep((value) => value + 1), 600);
    return () => window.clearTimeout(timer);
  }, [challenge.flow.length, executing, executionStep, testResult]);

  const stepSignal = () => {
    if (testResult !== "pass") return;
    setExecuting(false);
    setExecutionStep((value) => value < 0 || value >= challenge.flow.length - 1 ? 0 : value + 1);
  };

  const runSignal = () => {
    if (testResult !== "pass") return;
    if (!executing && executionStep >= challenge.flow.length - 1) setExecutionStep(0);
    setExecuting((value) => !value);
  };

  return (
    <>
      <WorkbenchHeader
        label="CPU DATAPATH CONSTRUCTION LAB"
        status={`${challenge.title} · ${components.length} components · ${edges.length} explicit buses`}
        actions={
          <>
            <button onClick={() => reset()}><Trash2 size={14} /> Reset</button>
            <button onClick={testCpu}><Check size={13} /> Validate</button>
            <button onClick={stepSignal} disabled={testResult !== "pass"}><StepForward size={13} /> Step signal</button>
            <button className="lab-run" onClick={runSignal} disabled={testResult !== "pass"}>
              {executing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {executing ? "Pause" : "Run instruction"}
            </button>
          </>
        }
      />
      <div className="builder-layout">
        <aside className="lab-controls component-palette">
          <span className="control-label">CHALLENGE</span>
          <div className="builder-challenges">
            {(Object.entries(BUILDER_CHALLENGES) as Array<[BuilderChallengeId, typeof challenge]>).map(([id, item]) => (
              <button className={challengeId === id ? "active" : ""} key={id} onClick={() => reset(id)}>
                <span>{id === "arithmetic" ? "01" : "02"}</span>
                <strong>{item.title}</strong>
                <code>{item.instruction}</code>
              </button>
            ))}
          </div>
          <div className="builder-objective">
            <span>YOUR GOAL</span>
            <p>{challenge.objective}</p>
          </div>
          <span className="control-label">COMPONENT LIBRARY</span>
          {CPU_COMPONENTS.map((component) => (
            <button
              disabled={components.includes(component.id)}
              key={component.id}
              onClick={() => addComponent(component.id)}
            >
              <Plus size={14} />
              <span><strong>{component.short}</strong>{component.label}<small>{component.purpose}</small></span>
            </button>
          ))}
          <p className="control-note">
            Components do not connect automatically. Select a block&apos;s output, then select the destination input.
          </p>
        </aside>
        <div className="builder-stage">
          <div className="builder-instructions">
            <span><b>1</b> Place the blocks required by the instruction.</span>
            <span><b>2</b> Click a source block, then its destination.</span>
            <span><b>3</b> Validate it, then step a signal through every stage.</span>
          </div>
          <div className={`instruction-flight ${testResult === "pass" ? "ready" : ""}`}>
            <div>
              <span>INSTRUCTION FLIGHT</span>
              <strong>{testResult === "pass" ? challenge.instruction : "Datapath must pass validation first"}</strong>
            </div>
            <div>
              {challenge.flow.map((id, index) => (
                <span
                  className={index === executionStep ? "active" : index < executionStep ? "complete" : ""}
                  key={`${id}-${index}`}
                >
                  <b>{componentFor(id).short}</b>
                  {index < challenge.flow.length - 1 && <ArrowRight size={11} />}
                </span>
              ))}
            </div>
          </div>
          <div className="builder-canvas">
            <div className="builder-grid">
              {components.length === 0 && (
                <div className="empty-canvas">
                  <Cpu size={35} />
                  <strong>Your datapath is empty</strong>
                  <span>Add a Program Counter to begin.</span>
                </div>
              )}
              {components.map((id, index) => {
                const component = componentFor(id);
                const outgoing = edges.filter((edge) => edge.startsWith(`${id}>`));
                const signalActive = testResult === "pass" && challenge.flow[executionStep] === id;
                const signalPassed = testResult === "pass" && challenge.flow.slice(0, executionStep + 1).includes(id);
                return (
                  <div className={`builder-node-wrap ${selectedSource === id ? "selected" : ""} ${signalPassed ? "signal-passed" : ""} ${signalActive ? "signal-active" : ""}`} key={id}>
                    <button className="builder-node" onClick={() => selectNode(id)}>
                      <small>{String(index + 1).padStart(2, "0")}</small>
                      <span className="node-port input-port">IN</span>
                      <strong>{component.short}</strong>
                      <span>{component.label}</span>
                      <span className="node-port output-port">OUT</span>
                    </button>
                    <button className="remove-node" onClick={() => removeComponent(id)} aria-label={`Remove ${component.label}`}>
                      <Trash2 size={12} />
                    </button>
                    <div className="node-links">
                      {outgoing.map((edge) => <span key={edge}>{edgeLabel(edge)}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="connection-panel">
              <div>
                <span>BUSES YOU CREATED</span>
                <strong>{selectedSource ? `${componentFor(selectedSource).short} output selected` : `${edges.length} connected`}</strong>
              </div>
              <div className="connection-list">
                {edges.length === 0 && <small>No buses yet. Select two blocks to connect them.</small>}
                {edges.map((edge) => (
                  <button
                    key={edge}
                    onClick={() => {
                      setEdges((items) => items.filter((item) => item !== edge));
                      setTestResult("idle");
                      setExecutionStep(-1);
                      setExecuting(false);
                    }}
                    aria-label={`Remove bus ${edgeLabel(edge)}`}
                  >
                    {edgeLabel(edge)} <span>×</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={`design-check ${testResult}`}>
            <div>
              {testResult === "pass" ? <Check size={20} /> : <Cpu size={20} />}
              <span>
                <strong>
                  {testResult === "pass"
                    ? "CPU PASSED"
                    : testResult === "fail"
                      ? "DATAPATH NEEDS WORK"
                      : challenge.instruction}
                </strong>
                <small>{testMessage}</small>
              </span>
            </div>
            <div className="design-checks">
              {challenge.requiredNodes.map((id) => (
                <span className={components.includes(id) ? "complete" : ""} key={`node-${id}`}>
                  {components.includes(id) ? "✓" : "○"} {componentFor(id).short}
                </span>
              ))}
              {challenge.requiredEdges.map((edge) => (
                <span className={edges.includes(edge) ? "complete" : ""} key={`edge-${edge}`}>
                  {edges.includes(edge) ? "✓" : "○"} {edgeLabel(edge)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-control">
      <span><b>{label}</b><strong>{value}{unit}</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <small><span>{min}{unit}</span><span>{max}{unit}</span></small>
    </label>
  );
}

function PerformanceLab() {
  const [workload, setWorkload] = useState<"general" | "compute" | "memory">("general");
  const [clock, setClock] = useState(3.2);
  const [width, setWidth] = useState(2);
  const [cacheHit, setCacheHit] = useState(92);
  const [branchAccuracy, setBranchAccuracy] = useState(90);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [samples, setSamples] = useState<number[]>([]);

  const profile = {
    general: { instructions: 1000, memory: 0.24, branches: 0.16 },
    compute: { instructions: 1400, memory: 0.08, branches: 0.1 },
    memory: { instructions: 800, memory: 0.52, branches: 0.08 },
  }[workload];
  const baseCpi = 1 / width;
  const cachePenalty = profile.memory * ((100 - cacheHit) / 100) * 36;
  const branchPenalty = profile.branches * ((100 - branchAccuracy) / 100) * 12;
  const cpi = baseCpi + cachePenalty + branchPenalty;
  const cycles = Math.round(profile.instructions * cpi);
  const ipc = 1 / cpi;
  const runtime = cycles / (clock * 1_000_000_000);
  const score = Math.max(5, Math.min(100, Math.round(100 / (cpi + 0.45))));
  const phase = progress === 0
    ? "READY"
    : progress < 15
      ? "WARMING CACHE"
      : progress < 85
        ? "EXECUTING"
        : progress < 100
          ? "DRAINING PIPELINE"
          : "REPORT READY";
  const completedInstructions = Math.round(profile.instructions * (progress / 100));

  useEffect(() => {
    if (!running) return;
    if (progress >= 100) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setProgress((value) => Math.min(100, value + 5));
      const variation = 0.86 + ((progress / 5) % 5) * 0.035;
      setSamples((items) => [...items.slice(-17), Math.min(width, ipc * variation)]);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [ipc, progress, running, width]);

  const resetBenchmark = () => {
    setRunning(false);
    setProgress(0);
    setSamples([]);
  };

  const toggleBenchmark = () => {
    if (!running && progress >= 100) {
      setProgress(0);
      setSamples([]);
    }
    setRunning((value) => !value);
  };

  return (
    <>
      <WorkbenchHeader
        label="MICROARCHITECTURE TUNER"
        status={`${profile.instructions.toLocaleString()} instruction benchmark · ${phase.toLowerCase()}`}
        actions={
          <>
            <button onClick={resetBenchmark}><RotateCcw size={14} /> Reset</button>
            <button className="lab-run" onClick={toggleBenchmark}>
              {running ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {running ? "Pause" : progress >= 100 ? "Run again" : "Run benchmark"}
            </button>
          </>
        }
      />
      <div className="performance-layout">
        <aside className="lab-controls">
          <span className="control-label">WORKLOAD</span>
          <div className="workload-options">
            {(["general", "compute", "memory"] as const).map((item) => (
              <button className={workload === item ? "active" : ""} key={item} onClick={() => setWorkload(item)}>
                <span>{item === "general" ? "GEN" : item === "compute" ? "ALU" : "MEM"}</span>
                {item}
              </button>
            ))}
          </div>
          <RangeControl label="Clock speed" value={clock} min={1} max={5} step={0.1} unit=" GHz" onChange={setClock} />
          <RangeControl label="Issue width" value={width} min={1} max={4} unit="-way" onChange={setWidth} />
          <RangeControl label="Cache hit rate" value={cacheHit} min={50} max={100} unit="%" onChange={setCacheHit} />
          <RangeControl label="Branch accuracy" value={branchAccuracy} min={50} max={100} unit="%" onChange={setBranchAccuracy} />
        </aside>
        <div className="performance-stage">
          <div className={`benchmark-runner ${running ? "running" : ""}`}>
            <div className="benchmark-head">
              <div><span>BENCHMARK ENGINE</span><strong>{phase}</strong></div>
              <div><span>RETIRED</span><strong>{completedInstructions.toLocaleString()} / {profile.instructions.toLocaleString()}</strong></div>
              <div><span>LIVE IPC</span><strong>{samples.length ? samples.at(-1)!.toFixed(2) : "—"}</strong></div>
            </div>
            <div className="benchmark-progress">
              <i style={{ width: `${progress}%` }} />
              <span style={{ left: `${Math.min(98, progress)}%` }}>{progress}%</span>
            </div>
            <div className="sample-bars" aria-label="Live instructions per cycle samples">
              {Array.from({ length: 18 }, (_, index) => {
                const sample = samples[index];
                return <i key={index} style={{ height: sample ? `${Math.max(8, (sample / width) * 100)}%` : "8%" }} />;
              })}
            </div>
          </div>
          <div className="score-card">
            <div>
              <span>PERFORMANCE SCORE</span>
              <strong>{score}</strong>
              <small>/ 100</small>
            </div>
            <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
              <span>{score >= 75 ? "FAST" : score >= 45 ? "BALANCED" : "BOTTLENECK"}</span>
            </div>
          </div>
          <div className="perf-metrics">
            <div><span>CPI</span><strong>{cpi.toFixed(2)}</strong><small>cycles / instruction</small></div>
            <div><span>IPC</span><strong>{ipc.toFixed(2)}</strong><small>instructions / cycle</small></div>
            <div><span>CYCLES</span><strong>{cycles.toLocaleString()}</strong><small>total benchmark</small></div>
            <div><span>RUNTIME</span><strong>{(runtime * 1e6).toFixed(2)} μs</strong><small>at {clock} GHz</small></div>
          </div>
          <div className="bottleneck-chart">
            <div className="chart-head"><span>CPI BREAKDOWN</span><strong>{cpi.toFixed(2)} total</strong></div>
            {[
              ["Ideal execution", baseCpi, "#70e5c0"],
              ["Cache misses", cachePenalty, "#ffba69"],
              ["Branch misses", branchPenalty, "#c6a0ff"],
            ].map(([label, value, color]) => (
              <div className="chart-row" key={label as string}>
                <span>{label}</span>
                <div><i style={{ width: `${Math.max(2, (Number(value) / cpi) * 100)}%`, background: color as string }} /></div>
                <strong>{Number(value).toFixed(2)}</strong>
              </div>
            ))}
          </div>
          <div className="optimization-tip">
            <Gauge size={20} />
            <div>
              <span>HIGHEST IMPACT</span>
              <strong>
                {cachePenalty > branchPenalty && cachePenalty > baseCpi
                  ? "Improve cache locality"
                  : branchPenalty > baseCpi
                    ? "Improve branch prediction"
                    : "Increase issue width"}
              </strong>
            </div>
            <p>
              The model recomputes throughput from instruction mix, miss penalties, and superscalar width.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
