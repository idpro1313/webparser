// FILE: examples/code/module.javascript.example.js
// VERSION: 0.1.0
// START_MODULE_CONTRACT
//   PURPOSE: Показывает GRACE-разметку для обычного JavaScript/browser messaging кода.
//   SCOPE: Runtime message bridge с безопасным отказом по таймауту.
//   DEPENDS: browser runtime messaging API
//   LINKS: M-BROWSER-BRIDGE / V-M-BROWSER-BRIDGE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   sendToRuntime - Sends one message to a runtime bridge and returns its response.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: v0.1.0 - Первичный JavaScript GRACE few-shot.
// END_CHANGE_SUMMARY

// START_CONTRACT: sendToRuntime
//   PURPOSE: Отправляет payload через browser runtime и возвращает стабильную ошибку при сбое.
//   INPUTS: { runtime: object - runtime adapter, payload: object - message payload }
//   OUTPUTS: { Promise<object> - runtime response }
//   SIDE_EFFECTS: Вызывает runtime.sendMessage и пишет console trace markers.
//   LINKS: V-M-BROWSER-BRIDGE scenario-runtime-message
// END_CONTRACT: sendToRuntime
export async function sendToRuntime(runtime, payload) {
  // START_BLOCK_VALIDATE_INPUT
  if (!runtime || typeof runtime.sendMessage !== "function") {
    console.warn("[BrowserBridge][sendToRuntime][BLOCK_VALIDATE_INPUT] invalid runtime", {
      reason: "RUNTIME_SEND_MESSAGE_REQUIRED",
    });
    throw new Error("RUNTIME_SEND_MESSAGE_REQUIRED");
  }
  // END_BLOCK_VALIDATE_INPUT

  // START_BLOCK_SEND_MESSAGE
  console.info("[BrowserBridge][sendToRuntime][BLOCK_SEND_MESSAGE] sending payload", {
    type: payload && payload.type,
  });
  return runtime.sendMessage(payload);
  // END_BLOCK_SEND_MESSAGE
}
