(() => {
  "use strict";

  const scale = 1.28;
  const caseWidths = Object.freeze({ "Mini-ITX": 390, "Micro-Tower": 450, "Midi-Tower": 520 });
  const boardMillimeters = Object.freeze({
    ATX: Object.freeze({ width: 244, height: 305 }),
    mATX: Object.freeze({ width: 244, height: 244 }),
    ITX: Object.freeze({ width: 170, height: 170 })
  });

  function layout(caseSize = "Midi-Tower", boardForm = "ATX", gpuLength = 0) {
    const caseWidth = caseWidths[caseSize] || caseWidths["Midi-Tower"];
    const board = boardMillimeters[boardForm] || boardMillimeters.ATX;
    return {
      caseWidth,
      boardWidth: Math.round(board.width * scale),
      boardHeight: Math.round(board.height * scale),
      gpuWidth: gpuLength ? Math.min(Math.round(gpuLength * scale), caseWidth - 84) : Math.min(320, caseWidth - 84),
      gpuHeight: 78
    };
  }

  window.BuildBenchVisualModel = Object.freeze({ scale, caseWidths, boardMillimeters, layout });
})();
