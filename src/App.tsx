import {
  BookOpen,
  Box,
  Braces,
  BrainCircuit,
  ChevronRight,
  CircleHelp,
  Clock3,
  Gauge,
  Github,
  Layers3,
  MemoryStick,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArchitectureLab, type LabId } from "./LabPages";

const STARTER_PROGRAM = `MOV R1, 10
MOV R2, 20
ADD R3, R1, R2
STORE R3, [100]`;

const STAGES = [
  { name: "Fetch", short: "IF", detail: "Read instruction from memory" },
  { name: "Decode", short: "ID", detail: "Interpret opcode and operands" },
  { name: "Register Read", short: "RR", detail: "Load source register values" },
  { name: "Execute", short: "EX", detail: "Perform the ALU operation" },
  { name: "Memory", short: "MEM", detail: "Read or write system memory" },
  { name: "Write Back", short: "WB", detail: "Commit result to register file" },
] as const;

type StageIndex = 0 | 1 | 2 | 3 | 4 | 5;
type Registers = Record<string, number>;
type ParsedInstruction =
  | { op: "MOV"; dest: string; value: number; raw: string }
  | { op: "ADD"; dest: string; left: string; right: string; raw: string }
  | { op: "STORE"; source: string; address: number; raw: string };

const initialRegisters = (): Registers =>
  Object.fromEntries(Array.from({ length: 8 }, (_, index) => [`R${index}`, 0]));

function parseProgram(source: string): ParsedInstruction[] {
  const parsed: ParsedInstruction[] = [];

  for (const line of source.split("\n")) {
    const raw = line.trim().toUpperCase();
    if (!raw) continue;

    let match = raw.match(/^MOV\s+(R[0-7])\s*,\s*(-?\d+)$/);
    if (match) {
      parsed.push({ op: "MOV", dest: match[1], value: Number(match[2]), raw });
      continue;
    }

    match = raw.match(/^ADD\s+(R[0-7])\s*,\s*(R[0-7])\s*,\s*(R[0-7])$/);
    if (match) {
      parsed.push({
        op: "ADD",
        dest: match[1],
        left: match[2],
        right: match[3],
        raw,
      });
      continue;
    }

    match = raw.match(/^STORE\s+(R[0-7])\s*,\s*\[(\d+)\]$/);
    if (match) {
      parsed.push({
        op: "STORE",
        source: match[1],
        address: Number(match[2]),
        raw,
      });
    }
  }

  return parsed;
}

function toBinary(value: number) {
  return (value & 0xff).toString(2).padStart(8, "0");
}

function opcodeFor(instruction?: ParsedInstruction) {
  if (!instruction) return "000000";
  return { MOV: "000101", ADD: "000001", STORE: "001100" }[instruction.op];
}

function App() {
  const [activeLab, setActiveLab] = useState<LabId | null>(() => {
    const lab = new URLSearchParams(window.location.search).get("lab");
    return ["alu", "pipeline", "cache", "branch", "builder", "performance"].includes(lab ?? "")
      ? lab as LabId
      : null;
  });
  const [program, setProgram] = useState(STARTER_PROGRAM);
  const instructions = useMemo(() => parseProgram(program), [program]);
  const [registers, setRegisters] = useState<Registers>(initialRegisters);
  const [memory, setMemory] = useState<Record<number, number>>({
    96: 0,
    97: 0,
    98: 0,
    99: 0,
    100: 0,
    101: 0,
  });
  const [instructionIndex, setInstructionIndex] = useState(0);
  const [stage, setStage] = useState<StageIndex>(0);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [changedRegister, setChangedRegister] = useState<string | null>(null);
  const [changedAddress, setChangedAddress] = useState<number | null>(null);
  const simulatorRef = useRef<HTMLElement>(null);

  const currentInstruction = instructions[instructionIndex];
  const executionResult = useMemo(() => {
    if (!currentInstruction) return 0;
    if (currentInstruction.op === "MOV") return currentInstruction.value;
    if (currentInstruction.op === "ADD") {
      return registers[currentInstruction.left] + registers[currentInstruction.right];
    }
    return registers[currentInstruction.source];
  }, [currentInstruction, registers]);

  const reset = useCallback(() => {
    setRunning(false);
    setRegisters(initialRegisters());
    setMemory({ 96: 0, 97: 0, 98: 0, 99: 0, 100: 0, 101: 0 });
    setInstructionIndex(0);
    setStage(0);
    setCycles(0);
    setCompleted(0);
    setChangedRegister(null);
    setChangedAddress(null);
  }, []);

  const step = useCallback(() => {
    if (!currentInstruction) {
      setRunning(false);
      return;
    }

    setCycles((value) => value + 1);
    setChangedRegister(null);
    setChangedAddress(null);

    if (stage === 4 && currentInstruction.op === "STORE") {
      setMemory((value) => ({
        ...value,
        [currentInstruction.address]: registers[currentInstruction.source],
      }));
      setChangedAddress(currentInstruction.address);
    }

    if (stage === 5) {
      if (currentInstruction.op === "MOV") {
        setRegisters((value) => ({
          ...value,
          [currentInstruction.dest]: currentInstruction.value,
        }));
        setChangedRegister(currentInstruction.dest);
      }

      if (currentInstruction.op === "ADD") {
        setRegisters((value) => ({
          ...value,
          [currentInstruction.dest]:
            value[currentInstruction.left] + value[currentInstruction.right],
        }));
        setChangedRegister(currentInstruction.dest);
      }

      setCompleted((value) => value + 1);
      if (instructionIndex >= instructions.length - 1) {
        setRunning(false);
        setInstructionIndex(instructions.length);
        setStage(0);
      } else {
        setInstructionIndex((value) => value + 1);
        setStage(0);
      }
      return;
    }

    setStage((value) => (value + 1) as StageIndex);
  }, [currentInstruction, instructionIndex, instructions.length, registers, stage]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(step, 620);
    return () => window.clearInterval(timer);
  }, [running, step]);

  useEffect(() => {
    const handleNavigation = () => {
      const lab = new URLSearchParams(window.location.search).get("lab");
      setActiveLab(
        ["alu", "pipeline", "cache", "branch", "builder", "performance"].includes(lab ?? "")
          ? lab as LabId
          : null,
      );
    };
    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  const launchSimulator = () => {
    simulatorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const navigateLab = (lab: LabId | null) => {
    const baseUrl = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;
    const url = lab ? `${baseUrl}?lab=${lab}` : baseUrl;
    window.history.pushState({}, "", url);
    setActiveLab(lab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (activeLab) {
    return (
      <ArchitectureLab
        activeLab={activeLab}
        onBack={() => navigateLab(null)}
        onNavigate={navigateLab}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="MicroVision home">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>microvision</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <button onClick={launchSimulator}>Simulator</button>
          <a href="#architecture">Architecture</a>
          <a href="#learn">Learn</a>
          <a href="#about">About</a>
        </nav>
        <a className="github-link" href="https://github.com" aria-label="View on GitHub">
          <Github size={18} />
          <span>GitHub</span>
        </a>
      </header>

      <main>
        <section className="hero" id="architecture">
          <HeroProcessor />
        </section>

        <section
          className={`simulator-section sim-stage-${stage} ${running ? "is-executing" : ""} ${
            !currentInstruction ? "is-complete" : ""
          }`}
          ref={simulatorRef}
        >
          <div className="section-heading">
            <div className="simulator-intro">
              <h2>Watch the CPU think.</h2>
              <p>
                Write assembly, run it cycle by cycle, and watch instructions,
                control signals, registers, buses, and memory change in real time.
              </p>
            </div>
            <div
              className={`live-status ${running ? "is-running" : ""} ${!currentInstruction ? "is-complete" : ""}`}
              aria-live="polite"
            >
              <span className="live-status-indicator" />
              <div>
                <strong>
                  {running
                    ? STAGES[stage].name
                    : currentInstruction
                      ? cycles > 0
                        ? `Paused · ${STAGES[stage].name}`
                        : "Ready to execute"
                      : "Program complete"}
                </strong>
                <small>
                  {running
                    ? `Cycle ${cycles + 1} · ${currentInstruction?.raw ?? "HALT"}`
                    : currentInstruction
                      ? cycles > 0
                        ? `Cycle ${cycles + 1} · ${currentInstruction.raw}`
                        : `Next: ${currentInstruction.raw}`
                      : `${completed} instructions · ${cycles} cycles`}
                </small>
              </div>
            </div>
          </div>

          <div
            className={`simulator-frame sim-stage-${stage} ${running ? "is-running" : ""} ${
              !currentInstruction ? "is-complete" : ""
            }`}
          >
            <div className="simulator-toolbar">
              <div className="file-tab">
                <Braces size={15} />
                main.asm
                <span className="file-dot" />
              </div>
              <div className="execution-controls">
                <button
                  className="run-control"
                  onClick={() => {
                    if (!currentInstruction) reset();
                    setRunning((value) => !value);
                  }}
                >
                  {running ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  {running ? "Pause" : "Run"}
                </button>
                <button onClick={step} disabled={!currentInstruction || running}>
                  <StepForward size={15} /> Step
                </button>
                <button onClick={reset}>
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
              <div className="clock-speed">
                <Clock3 size={14} />
                1.0×
              </div>
            </div>

            <div className="workspace">
              <AssemblyEditor
                program={program}
                onChange={(value) => {
                  setProgram(value);
                  reset();
                }}
                activeLine={instructionIndex}
                instructionCount={instructions.length}
              />
              <CpuVisualization
                instruction={currentInstruction}
                stage={stage}
                result={executionResult}
                registers={registers}
                cycles={cycles}
                running={running}
              />
              <StatePanel
                registers={registers}
                memory={memory}
                changedRegister={changedRegister}
                changedAddress={changedAddress}
                instruction={currentInstruction}
                stage={stage}
              />
            </div>

            <div className="timeline">
              <div className="timeline-label">
                <span>CURRENT CYCLE</span>
                <strong>{String(currentInstruction ? cycles + 1 : cycles).padStart(2, "0")}</strong>
              </div>
              <div className="stage-track">
                {STAGES.map((item, index) => (
                  <div
                    className={`stage-item timeline-stage-${index} ${
                      currentInstruction && index === stage ? "active" : ""
                    } ${currentInstruction && index < stage ? "complete" : ""}`}
                    key={item.name}
                  >
                    <span className="stage-node">
                      {index < stage && currentInstruction ? "✓" : item.short}
                    </span>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="metrics">
              <Metric label="Instructions" value={completed.toString()} sub="executed" />
              <Metric label="Clock cycles" value={cycles.toString()} sub="elapsed" />
              <Metric
                label="CPI"
                value={completed ? (cycles / completed).toFixed(1) : "—"}
                sub="cycles / instruction"
              />
              <Metric label="Cache hit rate" value="100%" sub="L1 data cache" accent />
              <Metric label="Pipeline stalls" value="0" sub="no hazards" />
            </div>
          </div>
        </section>

        <section className="feature-section" id="learn">
          <div className="feature-intro">
            <h2>Explore the systems<br />behind every cycle.</h2>
            <p>
              Open a focused lab to experiment with arithmetic, pipelines,
              caches, branch prediction, datapath design, and performance.
            </p>
          </div>
          <div className="feature-grid">
            <FeatureCard
              icon={<Zap size={20} />}
              index="01"
              title="ALU Explorer"
              body="Explore arithmetic, bitwise logic, shifts, flags, and carry propagation one bit at a time."
              color="lime"
              onOpen={() => navigateLab("alu")}
            />
            <FeatureCard
              icon={<Layers3 size={20} />}
              index="02"
              title="Pipeline"
              body="Watch hazards, stalls, forwarding, and flushes unfold by cycle."
              color="blue"
              onOpen={() => navigateLab("pipeline")}
            />
            <FeatureCard
              icon={<MemoryStick size={20} />}
              index="03"
              title="Cache Lab"
              body="Compare mapping strategies and see every hit, miss, and eviction."
              color="orange"
              onOpen={() => navigateLab("cache")}
            />
            <FeatureCard
              icon={<BrainCircuit size={20} />}
              index="04"
              title="Branch Predictor"
              body="Test prediction strategies and visualize the cost of being wrong."
              color="purple"
              onOpen={() => navigateLab("branch")}
            />
            <FeatureCard
              icon={<Box size={20} />}
              index="05"
              title="Build a CPU"
              body="Place components, wire explicit buses, and test whether an instruction can traverse your datapath."
              color="pink"
              onOpen={() => navigateLab("builder")}
            />
            <FeatureCard
              icon={<Gauge size={20} />}
              index="06"
              title="Performance Lab"
              body="Tune real workloads and measure CPI, throughput, and cache behavior."
              color="teal"
              onOpen={() => navigateLab("performance")}
            />
          </div>
        </section>
      </main>

      <footer id="about">
        <div className="footer-brand">
          <span className="brand-mark"><span /><span /><span /></span>
          microvision
        </div>
        <p>Built to make computer architecture visible.</p>
        <div>
          <a href="#learn"><BookOpen size={16} /> Documentation</a>
          <a href="https://github.com"><Github size={16} /> GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function HeroProcessor() {
  return (
    <div className="hero-processor" aria-label="Animated CPU datapath">
      <div className="cpu-hero-toolbar">
        <div>
          <span className="cpu-live-dot" />
          LIVE CPU DATAPATH
        </div>
        <div className="cpu-instruction">
          <span>INSTRUCTION</span>
          <code>ADD R3, R1, R2</code>
        </div>
        <div className="cpu-cycle" aria-label="Current pipeline cycle">
          {[
            ["01 · FETCH", "stage-fetch"],
            ["02 · DECODE", "stage-decode"],
            ["03 · REG READ", "stage-register"],
            ["04 · EXECUTE", "stage-execute"],
            ["05 · MEMORY", "stage-memory"],
            ["06 · WRITE BACK", "stage-writeback"],
          ].map(([label, stageClass]) => (
            <span className={stageClass} key={label}>{label}</span>
          ))}
        </div>
      </div>

      <div className="cpu-diagram-scroll">
        <svg className="hero-wires" viewBox="0 0 1240 650" role="img" aria-labelledby="cpu-diagram-title">
          <title id="cpu-diagram-title">
            Data moving between a program counter, instruction memory, control unit, registers, ALU, memory, and output
          </title>
          <defs>
            <filter id="cpuGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="busGradient" x1="0" x2="1">
              <stop offset="0" stopColor="#a2cf20" />
              <stop offset="0.5" stopColor="#d7ff58" />
              <stop offset="1" stopColor="#a2cf20" />
            </linearGradient>
          </defs>

          <g className="cpu-grid-guides">
            <path d="M0 250 H1240 M0 510 H1240" />
            <path d="M205 0 V650 M450 0 V650 M755 0 V650 M1010 0 V650" />
          </g>

          <g className="base-buses">
            <path d="M170 130 H290" />
            <path d="M470 130 H590" />
            <path d="M680 190 V245 H140 V320" />
            <path d="M680 190 V275 H565 V320" />
            <path d="M680 190 V245 H845 V300" />
            <path d="M250 360 H458" />
            <path d="M250 405 H461" />
            <path d="M650 380 H750" />
            <path d="M650 420 H700 V475 H1040 V390" />
            <path d="M940 365 H1040" />
            <path d="M1115 430 V555 H140 V450" />
          </g>

          <g className="control-buses">
            <path d="M590 110 H550 V285 H185 V320" />
            <path d="M770 110 H800 V285 H845 V300" />
            <path d="M680 190 V275 H565 V320" />
          </g>

          <g className="active-buses">
            <path className="flow flow-1 stage-fetch" d="M170 130 H290" />
            <path className="flow flow-2 stage-decode" d="M470 130 H590" />
            <path className="flow flow-3 stage-register" d="M680 190 V245 H140 V320" />
            <path className="flow flow-4 stage-execute" d="M250 360 H458" />
            <path className="flow flow-5 stage-execute" d="M250 405 H461" />
            <path className="flow flow-6 stage-memory" d="M650 380 H750" />
            <path className="flow flow-7 stage-memory" d="M940 365 H1040" />
            <path className="flow flow-8 stage-writeback" d="M650 420 H700 V475 H1040 V390" />
            <path className="flow flow-9 stage-writeback" d="M1115 430 V555 H140 V450" />
          </g>

          <g className="data-packets">
            <circle className="stage-fetch" r="5"><animateMotion begin="0s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M170 130 H290" /></circle>
            <circle className="stage-decode" r="5"><animateMotion begin="1.6s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M470 130 H590" /></circle>
            <circle className="stage-register" r="5"><animateMotion begin="3.2s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M680 190 V245 H140 V320" /></circle>
            <circle className="stage-execute" r="5"><animateMotion begin="4.8s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M250 360 H458" /></circle>
            <circle className="stage-execute" r="5"><animateMotion begin="4.8s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M250 405 H461" /></circle>
            <circle className="stage-memory" r="5"><animateMotion begin="6.4s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M650 380 H750" /></circle>
            <circle className="stage-memory" r="5"><animateMotion begin="6.4s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M940 365 H1040" /></circle>
            <circle className="stage-writeback" r="5"><animateMotion begin="8s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M650 420 H700 V475 H1040 V390" /></circle>
            <circle className="stage-writeback" r="5"><animateMotion begin="8s" calcMode="linear" dur="9.6s" keyPoints="0;1;1" keyTimes="0;0.1458;1" repeatCount="indefinite" path="M1115 430 V555 H140 V450" /></circle>
          </g>

          <g className="svg-cpu-node node-pc stage-target stage-fetch">
            <rect x="20" y="90" width="150" height="80" rx="3" />
            <rect className="stage-pulse" x="20" y="90" width="150" height="80" rx="3" />
            <text className="node-kicker" x="36" y="112">PROGRAM COUNTER</text>
            <text className="node-title" x="36" y="143">PC</text>
            <text className="node-value sequence-frame sequence-1" x="88" y="143">0</text>
            <text className="node-value sequence-frame sequence-2" x="88" y="143">0x</text>
            <text className="node-value sequence-frame sequence-3" x="88" y="143">0x0</text>
            <text className="node-value sequence-frame sequence-final" x="88" y="143">0x04</text>
            <circle cx="170" cy="130" r="4" />
          </g>

          <g className="svg-cpu-node node-imem stage-target stage-fetch">
            <rect x="290" y="90" width="180" height="80" rx="3" />
            <rect className="stage-pulse" x="290" y="90" width="180" height="80" rx="3" />
            <text className="node-kicker" x="308" y="112">INSTRUCTION MEMORY</text>
            <text className="node-title" x="308" y="143">I-MEM</text>
            <text className="node-value sequence-frame sequence-1" x="367" y="157">1010 101 010 101</text>
            <text className="node-value sequence-frame sequence-2" x="367" y="157">0101 110 101 011</text>
            <text className="node-value sequence-frame sequence-3" x="367" y="157">0011 001 110 100</text>
            <text className="node-value sequence-frame sequence-final" x="367" y="157">0001 011 001 010</text>
            <circle cx="290" cy="130" r="4" />
            <circle cx="470" cy="130" r="4" />
          </g>

          <g className="svg-cpu-node node-cu stage-target stage-decode">
            <rect x="590" y="80" width="180" height="110" rx="3" />
            <rect className="stage-pulse" x="590" y="80" width="180" height="110" rx="3" />
            <text className="node-kicker" x="608" y="103">CONTROL UNIT</text>
            <text className="node-title" x="608" y="137">CU</text>
            <text className="node-detail sequence-frame sequence-1" x="608" y="159">OPCODE · 000001</text>
            <text className="node-detail sequence-frame sequence-1" x="608" y="176">REG WRITE · 0</text>
            <text className="node-detail sequence-frame sequence-2" x="608" y="159">ALU CTRL · 0010</text>
            <text className="node-detail sequence-frame sequence-2" x="608" y="176">REG WRITE · 0</text>
            <text className="node-detail sequence-frame sequence-3" x="608" y="159">ALU OP · +</text>
            <text className="node-detail sequence-frame sequence-3" x="608" y="176">REG WRITE · 1</text>
            <text className="node-detail sequence-frame sequence-final" x="608" y="159">ALU OP · ADD</text>
            <text className="node-detail sequence-frame sequence-final" x="608" y="176">REG WRITE · 1</text>
            <circle cx="590" cy="130" r="4" />
            <circle cx="680" cy="190" r="4" />
          </g>

          <g className="svg-cpu-node node-regs stage-target stage-register">
            <rect x="30" y="320" width="220" height="130" rx="3" />
            <rect className="stage-pulse" x="30" y="320" width="220" height="130" rx="3" />
            <text className="node-kicker" x="50" y="344">REGISTER FILE</text>
            <text className="node-title" x="50" y="375">REGISTERS</text>
            <text className="node-detail" x="50" y="400">R1</text>
            <text className="node-detail" x="50" y="422">R2</text>
            <text className="node-detail" x="50" y="440">R3</text>
            <text className="node-value sequence-frame sequence-1" x="108" y="400">10110100</text>
            <text className="node-value sequence-frame sequence-1" x="108" y="422">01101011</text>
            <text className="node-value sequence-frame sequence-2" x="108" y="400">01001010</text>
            <text className="node-value sequence-frame sequence-2" x="108" y="422">00110100</text>
            <text className="node-value sequence-frame sequence-3" x="108" y="400">00001010</text>
            <text className="node-value sequence-frame sequence-3" x="108" y="422">00010100</text>
            <text className="node-value sequence-frame sequence-final" x="108" y="400">00001010</text>
            <text className="node-value sequence-frame sequence-final" x="108" y="422">00010100</text>
            <text className="node-value register-idle-value stage-writeback" x="108" y="440">00000000</text>
            <text className="node-value sequence-frame sequence-1 stage-writeback" x="108" y="440">00000000</text>
            <text className="node-value sequence-frame sequence-2 stage-writeback" x="108" y="440">00010010</text>
            <text className="node-value sequence-frame sequence-3 stage-writeback" x="108" y="440">00011100</text>
            <text className="node-value sequence-frame sequence-final stage-writeback" x="108" y="440">00011110</text>
            <circle cx="140" cy="320" r="4" />
            <circle cx="250" cy="360" r="4" />
            <circle cx="250" cy="405" r="4" />
            <circle cx="140" cy="450" r="4" />
          </g>

          <g className="svg-cpu-node node-alu stage-target stage-execute">
            <path d="M440 320 H610 L650 375 V425 L610 450 H440 L470 385 Z" />
            <path className="stage-pulse" d="M440 320 H610 L650 375 V425 L610 450 H440 L470 385 Z" />
            <text className="node-kicker" x="475" y="348">ARITHMETIC LOGIC UNIT</text>
            <text className="node-title" x="495" y="384">ALU</text>
            <text className="alu-value sequence-frame sequence-1" x="482" y="414">10</text>
            <text className="alu-value sequence-frame sequence-2" x="482" y="414">10 + 20</text>
            <text className="alu-value sequence-frame sequence-3" x="482" y="414">10 + 20 =</text>
            <text className="alu-value sequence-frame sequence-final" x="482" y="414">10 + 20 = 30</text>
            <circle cx="458" cy="360" r="4" />
            <circle cx="461" cy="405" r="4" />
            <circle cx="565" cy="320" r="4" />
            <circle cx="650" cy="380" r="4" />
            <circle cx="650" cy="420" r="4" />
          </g>

          <g className="svg-cpu-node node-memory stage-target stage-memory">
            <rect x="750" y="300" width="190" height="130" rx="3" />
            <rect className="stage-pulse" x="750" y="300" width="190" height="130" rx="3" />
            <text className="node-kicker" x="770" y="324">DATA MEMORY</text>
            <text className="node-title" x="770" y="355">MEM</text>
            {[0, 1, 2, 3].map((cell) => (
              <rect
                className={cell === 2 ? "memory-cell is-active" : "memory-cell"}
                height="25"
                key={cell}
                width="31"
                x={770 + cell * 36}
                y="372"
              />
            ))}
            <text className="node-value sequence-frame sequence-1" x="770" y="417">ADDR 0x__ · VALUE --</text>
            <text className="node-value sequence-frame sequence-2" x="770" y="417">ADDR 0x64 · VALUE --</text>
            <text className="node-value sequence-frame sequence-3" x="770" y="417">ADDR 0x64 · VALUE 1E</text>
            <text className="node-value sequence-frame sequence-final" x="770" y="417">ADDR 0x64 · VALUE 30</text>
            <circle cx="845" cy="300" r="4" />
            <circle cx="750" cy="380" r="4" />
            <circle cx="940" cy="365" r="4" />
          </g>

          <g className="svg-cpu-node node-output stage-target stage-writeback">
            <rect x="1040" y="330" width="150" height="100" rx="3" />
            <rect className="stage-pulse" x="1040" y="330" width="150" height="100" rx="3" />
            <text className="node-kicker" x="1058" y="354">WRITE BACK</text>
            <text className="node-title" x="1058" y="385">OUTPUT</text>
            <text className="node-value sequence-frame sequence-1" x="1058" y="410">R3 ← BUS</text>
            <text className="node-value sequence-frame sequence-2" x="1058" y="410">R3 ← 00011110</text>
            <text className="node-value sequence-frame sequence-3" x="1058" y="410">R3 ← 0x1E</text>
            <text className="node-value sequence-frame sequence-final" x="1058" y="410">R3 ← 30 · COMMIT</text>
            <circle cx="1040" cy="365" r="4" />
            <circle cx="1040" cy="390" r="4" />
            <circle cx="1115" cy="430" r="4" />
          </g>

          <g className="svg-bus-labels" aria-hidden="true">
            <g>
              <rect height="20" width="48" x="206" y="120" />
              <text textAnchor="middle" x="230" y="134">PC + 4</text>
            </g>
            <g>
              <rect height="20" width="68" x="496" y="120" />
              <text textAnchor="middle" x="530" y="134">INSTR WORD</text>
            </g>
            <g>
              <rect height="20" width="104" x="300" y="235" />
              <text textAnchor="middle" x="352" y="249">CONTROL SIGNALS</text>
            </g>
            <g>
              <rect height="20" width="54" x="327" y="350" />
              <text textAnchor="middle" x="354" y="364">READ A</text>
            </g>
            <g>
              <rect height="20" width="54" x="329" y="395" />
              <text textAnchor="middle" x="356" y="409">READ B</text>
            </g>
            <g>
              <rect height="20" width="62" x="674" y="370" />
              <text textAnchor="middle" x="705" y="384">RESULT</text>
            </g>
            <g>
              <rect height="20" width="80" x="950" y="355" />
              <text textAnchor="middle" x="990" y="369">MEMORY DATA</text>
            </g>
            <g>
              <rect height="20" width="142" x="557" y="545" />
              <text textAnchor="middle" x="628" y="559">WRITE-BACK · 00011110</text>
            </g>
          </g>

          <g className="svg-stage-strip">
            {[
              ["01 FETCH", "stage-fetch"],
              ["02 DECODE", "stage-decode"],
              ["03 REGISTER READ", "stage-register"],
              ["04 EXECUTE", "stage-execute"],
              ["05 MEMORY", "stage-memory"],
              ["06 WRITE BACK", "stage-writeback"],
            ].map(([item, stageClass], index) => (
              <g className={`stage-svg ${stageClass}`} key={item}>
                <rect className="stage-button-pulse" height="46" rx="2" width="178" x={66 + index * 190} y="588" />
                <rect className="stage-button-fill" height="38" rx="2" width="170" x={70 + index * 190} y="592" />
                <text textAnchor="middle" x={155 + index * 190} y="616">{item}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

function AssemblyEditor({
  program,
  onChange,
  activeLine,
  instructionCount,
}: {
  program: string;
  onChange: (value: string) => void;
  activeLine: number;
  instructionCount: number;
}) {
  const lines = program.split("\n");

  return (
    <div className="editor-panel">
      <div className="panel-title">
        <span>ASSEMBLY</span>
        <small>{instructionCount} instructions</small>
      </div>
      <div className="editor-body">
        <div className="line-numbers" aria-hidden="true">
          {lines.map((_, index) => (
            <span className={index === activeLine ? "active" : ""} key={index}>
              {String(index + 1).padStart(2, "0")}
            </span>
          ))}
        </div>
        <textarea
          aria-label="Assembly editor"
          value={program}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
        />
        {activeLine < instructionCount && (
          <div
            className="active-code-line"
            style={{ top: `${activeLine * 28 + 15}px` }}
          />
        )}
      </div>
      <div className="editor-help">
        <CircleHelp size={13} />
        Supports MOV, ADD, STORE
      </div>
    </div>
  );
}

function CpuVisualization({
  instruction,
  stage,
  result,
  registers,
  cycles,
  running,
}: {
  instruction?: ParsedInstruction;
  stage: StageIndex;
  result: number;
  registers: Registers;
  cycles: number;
  running: boolean;
}) {
  const registerDetail =
    instruction?.op === "ADD"
      ? `${instruction.left} · ${registers[instruction.left]}   ${instruction.right} · ${registers[instruction.right]}`
      : instruction?.op === "STORE"
        ? `${instruction.source} · ${registers[instruction.source]}`
        : instruction?.op === "MOV"
          ? `${instruction.dest} · ${instruction.value}`
          : "Awaiting instruction";
  const operation =
    !instruction
      ? "Execution complete · datapath idle"
      : [
          `Read instruction at PC · ${instruction.raw}`,
          `Decode ${instruction.op} · opcode ${opcodeFor(instruction)}`,
          `Read operands · ${registerDetail}`,
          instruction.op === "ADD" ? `Compute ${registers[instruction.left]} + ${registers[instruction.right]} = ${result}` : `Route value ${result} through ALU`,
          instruction.op === "STORE" ? `Write ${result} to address 0x${instruction.address.toString(16).toUpperCase()}` : "Memory stage bypassed",
          instruction.op === "STORE" ? "Store committed to memory" : `Commit ${result} to ${instruction.dest}`,
        ][stage];
  const registerBits = (name?: string) =>
    name ? Number(name.slice(1)).toString(2).padStart(3, "0") : "---";
  const commitTarget =
    instruction?.op === "STORE"
      ? `MEM 0x${instruction.address.toString(16).toUpperCase()}`
      : instruction
        ? instruction.dest
        : "—";
  const operandA =
    instruction?.op === "ADD"
      ? registers[instruction.left]
      : instruction?.op === "STORE"
        ? registers[instruction.source]
        : instruction?.op === "MOV"
          ? instruction.value
          : 0;
  const operandB = instruction?.op === "ADD" ? registers[instruction.right] : 0;
  const instructionFields =
    instruction?.op === "ADD"
      ? `${opcodeFor(instruction)} ${registerBits(instruction.dest)} ${registerBits(instruction.left)} ${registerBits(instruction.right)}`
      : instruction?.op === "MOV"
        ? `${opcodeFor(instruction)} ${registerBits(instruction.dest)} ${toBinary(instruction.value)}`
        : instruction?.op === "STORE"
          ? `${opcodeFor(instruction)} ${registerBits(instruction.source)} ${toBinary(instruction.address)}`
          : "000000 --- 00000000";
  const stageSnapshots = [
    {
      input: `PC 0x${(Math.floor(cycles / 6) * 4).toString(16).padStart(2, "0").toUpperCase()}`,
      action: "READ INSTRUCTION MEMORY",
      output: instruction?.raw ?? "NO INSTRUCTION",
    },
    {
      input: instructionFields,
      action: "SPLIT OPCODE + OPERANDS",
      output: instruction ? `${instruction.op} / ${opcodeFor(instruction)}` : "NO OPCODE",
    },
    {
      input: registerDetail,
      action: "OPEN REGISTER READ PORTS",
      output: `${toBinary(operandA)} / ${toBinary(operandB)}`,
    },
    {
      input: `${toBinary(operandA)} / ${toBinary(operandB)}`,
      action: instruction?.op === "ADD" ? "ADD A + B" : "PASS A THROUGH",
      output: toBinary(result),
    },
    {
      input: instruction?.op === "STORE" ? `ADDR ${instruction.address} / ${toBinary(result)}` : toBinary(result),
      action: instruction?.op === "STORE" ? "ASSERT MEMORY WRITE" : "BYPASS DATA MEMORY",
      output: instruction?.op === "STORE" ? "WRITE ACKNOWLEDGED" : "NO MEMORY ACCESS",
    },
    {
      input: toBinary(result),
      action: `COMMIT TO ${commitTarget}`,
      output: instruction ? `${commitTarget} = ${result}` : "RETIRE QUEUE EMPTY",
    },
  ];
  const snapshot = instruction
    ? stageSnapshots[stage]
    : { input: "00000000", action: "EXECUTION COMPLETE", output: "NO INSTRUCTION IN FLIGHT" };
  const controlSignals = ["IR LOAD", "DECODE", "REG READ", "ALU ENABLE", "MEM WRITE", "REG WRITE"];
  const traceRows = [
    {
      label: "CLK",
      value: running ? "TOGGLING" : "HOLD",
      points: "0,18 20,18 20,5 42,5 42,18 64,18 64,5 86,5 86,18 108,18 108,5 130,5 130,18 152,18 152,5 174,5 174,18 196,18 196,5 218,5 218,18 240,18",
    },
    {
      label: "CTRL",
      value: toBinary(1 << stage),
      points: `0,18 ${stage * 25 + 18},18 ${stage * 25 + 18},7 ${stage * 25 + 48},7 ${stage * 25 + 48},18 240,18`,
    },
    {
      label: "DATA",
      value: toBinary(result),
      points: "0,14 22,14 34,8 49,19 65,6 82,16 100,10 118,18 136,7 154,14 172,5 190,17 208,9 224,14 240,11",
    },
    {
      label: "VALID",
      value: instruction ? "1" : "0",
      points: instruction ? "0,18 34,18 34,6 206,6 206,18 240,18" : "0,18 240,18",
    },
  ];
  const visibleCycle = instruction ? cycles + 1 : cycles;
  const visibleTapeLength = Math.min(8, Math.max(1, visibleCycle));
  const firstVisibleCycle = Math.max(1, visibleCycle - visibleTapeLength + 1);
  const cycleTape = Array.from({ length: visibleTapeLength }, (_, index) => {
    const cycle = firstVisibleCycle + index;
    const cycleStage = (cycle - 1) % STAGES.length;
    const isCurrent = Boolean(instruction) && cycle === visibleCycle;
    const isComplete = instruction ? cycle < visibleCycle : cycle <= visibleCycle;
    return {
      cycle,
      instruction: Math.ceil(cycle / STAGES.length),
      stage: STAGES[cycleStage],
      state: isCurrent ? "current" : isComplete ? "complete" : "queued",
    };
  });

  return (
    <div className="cpu-panel">
      <div className="panel-title">
        <span><i className={running ? "panel-live-dot is-running" : "panel-live-dot"} /> MICRO DEBUGGER</span>
        <small>{instruction ? `cycle ${cycles + 1}` : "halted"} · 8-bit</small>
      </div>
      <div className="cpu-canvas debugger-canvas">
        <div className="debugger-grid">
          <section className="stage-inspector">
            <div className="debugger-heading">
              <span>BREAKPOINT / {instruction ? STAGES[stage].short : "HALT"}</span>
              <i>{running ? "STREAMING" : instruction ? "LATCHED" : "COMPLETE"}</i>
            </div>
            <div className="stage-focus" key={`${stage}-${cycles}`}>
              <span>{instruction ? String(stage + 1).padStart(2, "0") : "—"}</span>
              <div>
                <small>ACTIVE STAGE</small>
                <strong>{instruction ? STAGES[stage].name : "Program complete"}</strong>
                <p>{operation}</p>
              </div>
            </div>
            <div className="transform-stack">
              <div>
                <span>INPUT</span>
                <code>{snapshot.input}</code>
              </div>
              <b>↓</b>
              <div className="transform-action">
                <span>HARDWARE ACTION</span>
                <code>{snapshot.action}</code>
              </div>
              <b>↓</b>
              <div>
                <span>OUTPUT</span>
                <code>{snapshot.output}</code>
              </div>
            </div>
            <div className="control-bank">
              {controlSignals.map((signal, index) => (
                <span className={instruction && stage === index ? "on" : ""} key={signal}>
                  <i>{instruction && stage === index ? "1" : "0"}</i>
                  {signal}
                </span>
              ))}
            </div>
          </section>

          <section className={running ? "logic-analyzer is-running" : "logic-analyzer"}>
            <div className="debugger-heading">
              <span>LOGIC ANALYZER</span>
              <i>{instruction ? `T${String(cycles + 1).padStart(2, "0")}` : "HALT"}</i>
            </div>
            <div className="trace-stack">
              {traceRows.map((trace) => (
                <div className="trace-row" key={trace.label}>
                  <span>{trace.label}</span>
                  <svg viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden="true">
                    <polyline points={trace.points} />
                  </svg>
                  <code>{trace.value}</code>
                </div>
              ))}
              <i className="scope-cursor" />
            </div>
            <div className="bus-decoder">
              <span>BUS DECODER</span>
              <div>
                {toBinary(result).split("").map((bit, index) => (
                  <i className={bit === "1" ? "high" : ""} key={`${index}-${bit}`}>
                    {bit}
                  </i>
                ))}
              </div>
              <code>{result} DEC / 0x{result.toString(16).padStart(2, "0").toUpperCase()}</code>
            </div>
          </section>

          <section className="cycle-memory">
            <div className="debugger-heading">
              <span>CYCLE MEMORY</span>
              <i>RETIRED ← CLOCK FLOW ← NEW TICK</i>
            </div>
            <div
              className={`cycle-tape-window ${cycleTape.length === 8 ? "is-full" : ""}`}
              key={`${visibleCycle}-${instruction ? "live" : "halt"}`}
            >
              <div className={`cycle-tape ${cycles > 0 ? "advancing" : ""}`}>
                {cycleTape.map((tick) => (
                  <div className={tick.state} key={tick.cycle}>
                    <span>T{String(tick.cycle).padStart(2, "0")}</span>
                    <strong>{tick.stage.short}</strong>
                    <small>I{tick.instruction}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatePanel({
  registers,
  memory,
  changedRegister,
  changedAddress,
  instruction,
  stage,
}: {
  registers: Registers;
  memory: Record<number, number>;
  changedRegister: string | null;
  changedAddress: number | null;
  instruction?: ParsedInstruction;
  stage: StageIndex;
}) {
  return (
    <div className="state-panel">
      <div className="panel-title">
        <span>STATE</span>
        <small>live values</small>
      </div>
      <div className="state-section">
        <div className="state-heading">
          <span>REGISTERS</span>
          <span>BIN</span>
        </div>
        <div className="register-list">
          {Object.entries(registers).map(([name, value]) => (
            <div className={changedRegister === name ? "changed" : ""} key={name}>
              <strong>{name}</strong>
              <span>{toBinary(value)}</span>
              <small>{value}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="state-section memory-section">
        <div className="state-heading">
          <span>MEMORY</span>
          <span>VALUE</span>
        </div>
        {Object.entries(memory)
          .slice(-4)
          .map(([address, value]) => (
            <div className={`memory-row ${changedAddress === Number(address) ? "changed" : ""}`} key={address}>
              <span>0x{Number(address).toString(16).toUpperCase().padStart(2, "0")}</span>
              <strong>{toBinary(value)}</strong>
              <small>{value}</small>
            </div>
          ))}
      </div>
      <div className="control-signals">
        <div className="state-heading"><span>CONTROL SIGNALS</span></div>
        <div>
          <span className={instruction && stage === 5 && instruction.op !== "STORE" ? "on" : ""}>
            REG WRITE
          </span>
          <span className={instruction?.op === "STORE" && stage === 4 ? "on" : ""}>
            MEM WRITE
          </span>
          <span className={stage === 3 ? "on" : ""}>ALU ENABLE</span>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong key={value} className={accent ? "accent" : ""}>
        {value}
      </strong>
      <small>{sub}</small>
    </div>
  );
}

function FeatureCard({
  icon,
  index,
  title,
  body,
  color,
  onOpen,
}: {
  icon: React.ReactNode;
  index: string;
  title: string;
  body: string;
  color: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={`feature-card ${color}`}
      onClick={onOpen}
      aria-label={`Explore ${title}`}
    >
      <div className="feature-card-top">
        <span className="feature-icon">{icon}</span>
        <small>{index}</small>
      </div>
      <span className="feature-card-title">{title}</span>
      <span className="feature-card-body">{body}</span>
      <span className="feature-card-action" aria-hidden="true">
        Explore <ChevronRight size={15} />
      </span>
    </button>
  );
}

export default App;
