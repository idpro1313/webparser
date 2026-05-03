// FILE: examples/code/module.typescript.example.ts
// VERSION: 0.1.0
// START_MODULE_CONTRACT
//   PURPOSE: Показывает строгие поля GRACE-контракта и LDD-маркеры в TypeScript.
//   SCOPE: Валидация входных данных, логирование решений и стабильная сборка результата.
//   DEPENDS: нет
//   LINKS: M-EXAMPLE / V-M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   registerUser - Валидирует регистрационные данные и возвращает стабильный результат.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: v0.1.0 - Первичный строгий TypeScript GRACE few-shot.
// END_CHANGE_SUMMARY

type RegisterResult =
  | { success: true; userId: string }
  | { success: false; error: "VALIDATION_ERROR" | "USER_EXISTS" };

function logLdd(marker: string, fields: Record<string, unknown>): void {
  console.info(marker, fields);
}

// START_CONTRACT: registerUser
//   PURPOSE: Регистрирует пользователя только после проверки username, password и уникальности.
//   INPUTS: { username: string, password: string, email: string }
//   OUTPUTS: { RegisterResult - успех с userId или стабильная ошибка отказа }
//   SIDE_EFFECTS: Пишет строгие LDD-маркеры; пример не сохраняет данные.
//   LINKS: V-M-EXAMPLE scenario-registration
//   PRECONDITIONS: trimmed username длиной >= 3; password длиной >= 8; email не пустой.
//   POSTCONDITIONS: некорректный ввод возвращает VALIDATION_ERROR без BLOCK_CREATE_USER.
//   INVARIANTS: password никогда не логируется; все причины отказа - стабильные коды.
//   FORBIDDEN_CHANGES: не удалять проверку длины password и не логировать raw password.
//   KEYWORDS: DOMAIN(Auth); CONCEPT(Validation); PATTERN(ResultObject)
// END_CONTRACT: registerUser
export function registerUser(username: string, password: string, email: string): RegisterResult {
  // START_BLOCK_VALIDATE_INPUT
  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3 || password.length < 8 || email.trim().length === 0) {
    logLdd("[VALIDATION][IMP:9][registerUser][BLOCK_VALIDATE_INPUT][DECISION] registration rejected [STATUS:FAIL]", {
      usernameLength: trimmedUsername.length,
      passwordLength: password.length,
      hasEmail: email.trim().length > 0,
      reason: "VALIDATION_ERROR",
    });
    return { success: false, error: "VALIDATION_ERROR" };
  }
  // END_BLOCK_VALIDATE_INPUT

  // START_BLOCK_CREATE_USER
  const userId = `user_${trimmedUsername.toLowerCase()}`;
  logLdd("[LOGIC][IMP:9][registerUser][BLOCK_CREATE_USER][STATE_CHANGE] user accepted [STATUS:OK]", {
    userId,
  });
  return { success: true, userId };
  // END_BLOCK_CREATE_USER
}
