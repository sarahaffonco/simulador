import { useState } from "react";

import { createInitialRegisters } from "./simulator/cpu/registers";

import {
  createInitialMemory,
  readMemory,
  writeMemory,
} from "./simulator/memory/memory";

import type { RAM } from "./simulator/memory/types";

import { Opcode } from "./simulator/instructions/types";
import { loadProgram } from "./simulator/instructions/program";

import type { CPURegisters, CPUStatus } from "./simulator/cpu/types";

import { executeInstruction } from "./simulator/cpu/controlUnit";

import type { Cache } from "./simulator/cache/types";
import { createInitialCache } from "./simulator/cache/cache";

import type { IOController } from "./simulator/io/types";
import { createInitialIO, setInput } from "./simulator/io/controller";

type ProgramType = "sum" | "io";

function createProgramMemory(programType: ProgramType = "sum"): RAM {
  let initialMemory = createInitialMemory();

  // Inicializa os dados utilizados pelo programa de soma.
  initialMemory = writeMemory(initialMemory, 10, 5);
  initialMemory = writeMemory(initialMemory, 11, 3);
  initialMemory = writeMemory(initialMemory, 12, 0);

  // Seleciona as instruções conforme o programa escolhido.
  if (programType === "io") {
    return loadProgram(initialMemory, [
      { opcode: Opcode.IN, operand: 0 },
      { opcode: Opcode.OUT, operand: 0 },
      { opcode: Opcode.HLT, operand: 0 },
    ]);
  }

  return loadProgram(initialMemory, [
    { opcode: Opcode.LOAD, operand: 10 },
    { opcode: Opcode.ADD, operand: 11 },
    { opcode: Opcode.STORE, operand: 12 },
    { opcode: Opcode.HLT, operand: 0 },
  ]);
}

function App() {
  const [registers, setRegisters] = useState<CPURegisters>(
    createInitialRegisters,
  );
  function handleStep() {
    if (status === "halted" || status === "error") {
      return;
    }

    try {
      setStatus("running");

      const result = executeInstruction(registers, memory, cache, io);
      setRegisters(result.registers);
      setMemory(result.memory);
      setCache(result.cache);
      setIO(result.io);

      if (result.halted) {
        setStatus("halted");
        setExecutionMessage("Programa finalizado com sucesso.");
      } else {
        setExecutionMessage(
          `Instrução executada. Próximo endereço: ${result.registers.PC}.`,
        );
      }
    } catch (error) {
      setStatus("error");

      setExecutionMessage(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro durante a execução.",
      );
    }
  }
  async function handleRun() {
    if (status === "halted" || status === "error" || isRunning) {
      return;
    }

    setIsRunning(true);
    setStatus("running");

    let currentRegisters = registers;
    let currentMemory = memory;
    let currentCache = cache;
    let currentIO = io;

    try {
      for (let step = 0; step < 256; step++) {
        const result = executeInstruction(
          currentRegisters,
          currentMemory,
          currentCache,
          currentIO,
        );

        currentRegisters = result.registers;
        currentMemory = result.memory;
        currentCache = result.cache;
        currentIO = result.io;

        setRegisters(currentRegisters);
        setMemory(currentMemory);
        setCache(currentCache);
        setIO(currentIO);

        if (result.halted) {
          setStatus("halted");
          setExecutionMessage("Programa finalizado com sucesso.");
          return;
        }

        setExecutionMessage(
          `Instrução executada. Próximo endereço: ${currentRegisters.PC}.`,
        );

        // Aguarda 600 milissegundos antes da próxima instrução.
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      throw new Error(
        "Limite de instruções atingido. Verifique se o programa possui HLT.",
      );
    } catch (error) {
      setStatus("error");

      setExecutionMessage(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro durante a execução.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  function handleReset() {
    setRegisters(createInitialRegisters());
    setMemory(createProgramMemory(selectedProgram));
    setStatus("ready");
    setExecutionMessage("Aguardando início da execução.");
    setCache(createInitialCache());
    setIO(createInitialIO());
  }

  function handleSendInput() {
    const value = Number(inputValue);

    if (
      inputValue.trim() === "" ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 65535
    ) {
      setExecutionMessage("Digite um número inteiro entre 0 e 65535.");
      return;
    }

    try {
      setIO(setInput(io, value));
      setInputValue("");
      setExecutionMessage(`Valor ${value} recebido pelo teclado.`);
    } catch (error) {
      setExecutionMessage(
        error instanceof Error ? error.message : "Erro ao receber entrada.",
      );
    }
  }

  const registerList = [
    {
      name: "PC",
      description: "Program Counter",
      value: String(registers.PC).padStart(3, "0"),
    },
    {
      name: "IR",
      description: "Instruction Register",
      value: registers.IR ?? "---",
    },
    {
      name: "ACC",
      description: "Accumulator",
      value: String(registers.ACC).padStart(4, "0"),
    },
    {
      name: "MAR",
      description: "Memory Address Register",
      value: String(registers.MAR).padStart(3, "0"),
    },
    {
      name: "MDR",
      description: "Memory Data Register",
      value: String(registers.MDR).padStart(4, "0"),
    },
    {
      name: "FLAGS",
      description: "Zero / Negative / Carry",
      value: `${Number(registers.FLAGS.zero)} / ${Number(registers.FLAGS.negative)} / ${Number(registers.FLAGS.carry)}`,
    },
  ];

  const [selectedProgram, setSelectedProgram] = useState<ProgramType>("sum");

  const [memory, setMemory] = useState<RAM>(() => createProgramMemory("sum"));
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<CPUStatus>("ready");
  const [cache, setCache] = useState<Cache>(createInitialCache);
  const [executionMessage, setExecutionMessage] = useState(
    "Aguardando início da execução.",
  );
  const memoryRows = Array.from({ length: 16 }, (_, address) => ({
    address,
    value: readMemory(memory, address),
  }));
  const cacheRows = cache.lines.map((line, index) => ({
    index,
    address: line?.address,
    value: line?.value,
    empty: line === null,
  }));
  const [io, setIO] = useState<IOController>(createInitialIO);
  const [inputValue, setInputValue] = useState("");
  function handleProgramChange(programType: ProgramType) {
    setSelectedProgram(programType);

    setRegisters(createInitialRegisters());
    setMemory(createProgramMemory(programType));
    setCache(createInitialCache());
    setIO(createInitialIO());

    setInputValue("");
    setStatus("ready");
    setExecutionMessage("Aguardando início da execução.");
  }
  return (
    <div className="app">
      <header className="header">
        <div>
          <span className="brand-icon">NC</span>
          <span className="brand-name">NeoCore Simulator</span>
        </div>

        <span className="header-status">
          <span className="status-dot" />

          {status === "ready" && "Processador pronto"}
          {status === "running" && "Processador em execução"}
          {status === "halted" && "Processador finalizado"}
          {status === "error" && "Erro no processador"}
        </span>
      </header>

      <main className="main">
        <section className="welcome">
          <div>
            <p className="eyebrow">AMBIENTE DE APRENDIZAGEM</p>
            <h1>Simulador de Arquitetura de Computadores</h1>
            <p>
              Explore os componentes de um processador e acompanhe como as
              instruções são executadas.
            </p>
          </div>

          <div className="architecture-tag">
            <strong>Von Neumann</strong>
            <span>CPU de 16 bits</span>
          </div>
        </section>

        <section className="summary-grid">
          <article className="summary-card">
            <span>Processador</span>
            <strong>16 bits</strong>
            <small>Arquitetura simulada</small>
          </article>

          <article className="summary-card">
            <span>Memória RAM</span>
            <strong>256</strong>
            <small>Posições de 16 bits</small>
          </article>

          <article className="summary-card">
            <span>Cache</span>
            <strong>4 linhas</strong>
            <small>Política FIFO</small>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h2>Entrada e saída</h2>
                <p>Controlador de teclado e monitor</p>
              </div>
            </div>

            <div className="io-section">
              <h3>Teclado</h3>

              <div className="io-input">
                <input
                  type="number"
                  min="0"
                  max="65535"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Digite um número"
                  disabled={isRunning}
                />

                <button
                  onClick={handleSendInput}
                  disabled={isRunning || inputValue.trim() === ""}
                >
                  Enviar
                </button>
              </div>

              <p>
                Entrada disponível:{" "}
                <strong>{io.input !== null ? io.input : "Nenhuma"}</strong>
              </p>
            </div>

            <div className="io-section">
              <h3>Monitor</h3>

              {io.output.length === 0 ? (
                <p>Nenhum valor enviado.</p>
              ) : (
                <ul>
                  {io.output.map((value, index) => (
                    <li key={index}>
                      Saída {index + 1}: <strong>{value}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>

          <article className="summary-card">
            <span>Instruções</span>
            <strong>7</strong>
            <small>Conjunto inicial</small>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel registers-panel">
            <div className="panel-heading">
              <div>
                <h2>Registradores da CPU</h2>
                <p>Estado atual dos registradores</p>
              </div>
              <span className="panel-tag">CPU</span>
            </div>

            <div className="register-list">
              {registerList.map((register) => (
                <div className="register-row" key={register.name}>
                  <div>
                    <strong>{register.name}</strong>
                    <small>{register.description}</small>
                  </div>
                  <code>{register.value}</code>
                </div>
              ))}
            </div>
          </article>

          <article className="panel execution-panel">
            <div className="panel-heading">
              <div>
                <h2>Execução do programa</h2>
                <p>Acompanhe o ciclo de instrução</p>
              </div>
              <span className="panel-tag">CPU</span>
            </div>
            <div className="program-selector">
              <label htmlFor="program-select">Programa para executar</label>

              <select
                id="program-select"
                value={selectedProgram}
                onChange={(event) =>
                  handleProgramChange(event.target.value as ProgramType)
                }
                disabled={isRunning}
              >
                <option value="sum">Programa 1 — Soma</option>
                <option value="io">Programa 2 — Entrada e saída</option>
              </select>
            </div>
            <div className="execution-empty">
              <div className="empty-icon">▶</div>

              <strong>
                {status === "ready" && "Programa aguardando execução"}
                {status === "running" && "Programa em execução"}
                {status === "halted" && "Programa finalizado"}
                {status === "error" && "Erro na execução"}
              </strong>

              <p>{executionMessage}</p>
            </div>

            <div className="execution-actions">
              <button
                type="button"
                onClick={handleRun}
                disabled={
                  status === "halted" || status === "error" || isRunning
                }
              >
                {isRunning ? "Executando..." : "Executar"}
              </button>

              <button
                type="button"
                onClick={handleStep}
                disabled={
                  status === "halted" || status === "error" || isRunning
                }
              >
                Próxima etapa
              </button>
              <button type="button" onClick={handleReset} disabled={isRunning}>
                Reiniciar
              </button>
            </div>
          </article>

          <article className="panel memory-panel">
            <div className="panel-heading">
              <div>
                <h2>Memória RAM</h2>
                <p>Visualização inicial de endereços</p>
              </div>
              <span className="panel-tag">256 posições</span>
            </div>

            <div className="memory-preview">
              {memoryRows.map((item) => (
                <div className="memory-cell" key={item.address}>
                  <small>Endereço {item.address}</small>

                  <code>{String(item.value).padStart(4, "0")}</code>
                </div>
              ))}
            </div>

            <p className="memory-note">
              Exibindo 16 das 256 posições disponíveis.
            </p>
          </article>
          <article className="panel cache-panel">
            <div className="panel-heading">
              <div>
                <h2>Memória Cache</h2>
                <p>Quatro linhas de armazenamento</p>
              </div>

              <span className="panel-tag">FIFO</span>
            </div>

            <div className="cache-preview">
              {cacheRows.map((item) => (
                <div className="cache-cell" key={item.index}>
                  <div>
                    <strong>Linha {item.index}</strong>
                    <small>
                      {item.empty ? "Vazia" : `Endereço ${item.address}`}
                    </small>
                  </div>

                  <code>
                    {item.empty ? "----" : String(item.value).padStart(4, "0")}
                  </code>
                </div>
              ))}
            </div>

            <p className="memory-note">
              Exibindo as 4 linhas disponíveis da memória cache.
            </p>
          </article>

          <article className="panel architecture-panel">
            <div className="panel-heading">
              <div>
                <h2>Componentes do sistema</h2>
                <p>Visão geral da arquitetura</p>
              </div>
            </div>

            <div className="component-list">
              <div>
                <span>01</span> Unidade de Controle
              </div>
              <div>
                <span>02</span> Unidade Lógica e Aritmética
              </div>
              <div>
                <span>03</span> Registradores
              </div>
              <div>
                <span>04</span> Cache e memória RAM
              </div>
              <div>
                <span>05</span> Barramentos
              </div>
              <div>
                <span>06</span> Entrada e saída
              </div>
            </div>
          </article>
        </section>

        <footer className="footer">
          NeoCore Tech · Simulador didático de Arquitetura e Organização de
          Computadores ·Criado Por: Sarah Affonço
        </footer>
      </main>
    </div>
  );
}

export default App;
