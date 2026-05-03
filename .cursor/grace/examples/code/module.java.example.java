// FILE: examples/code/module.java.example.java
// VERSION: 0.1.0
// START_MODULE_CONTRACT
//   PURPOSE: Показывает строгие поля GRACE-контракта и LDD-маркеры в Java.
//   SCOPE: Валидация входных данных, стабильная сборка результата и трассируемые решения.
//   DEPENDS: java.util.Map
//   LINKS: M-EXAMPLE / V-M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   RegistrationService - Валидирует регистрационные данные и возвращает стабильный результат.
//   registerUser - Primary registration decision function.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: v0.1.0 - Первичный Java GRACE few-shot.
// END_CHANGE_SUMMARY

package examples.code;

import java.util.Map;

public final class RegistrationService {
    public record RegisterResult(boolean success, String userId, String error) {}

    private RegistrationService() {}

    private static void logLdd(String marker, Map<String, Object> fields) {
        System.out.println(marker + " " + fields);
    }

    // START_CONTRACT: registerUser
    //   PURPOSE: Регистрирует пользователя только после проверки username, password и email.
    //   INPUTS: { username: String, password: String, email: String }
    //   OUTPUTS: { RegisterResult - успех с userId или стабильная ошибка отказа }
    //   SIDE_EFFECTS: Пишет строгие LDD-маркеры; пример не сохраняет данные.
    //   LINKS: V-M-EXAMPLE scenario-registration
    //   PRECONDITIONS: trimmed username длиной >= 3; password длиной >= 8; email не пустой.
    //   POSTCONDITIONS: некорректный ввод возвращает VALIDATION_ERROR без BLOCK_CREATE_USER.
    //   INVARIANTS: password никогда не логируется; все причины отказа - стабильные коды.
    //   FORBIDDEN_CHANGES: не удалять проверку длины password и не логировать raw password.
    //   KEYWORDS: DOMAIN(Auth); CONCEPT(Validation); PATTERN(ResultObject)
    // END_CONTRACT: registerUser
    public static RegisterResult registerUser(String username, String password, String email) {
        // START_BLOCK_VALIDATE_INPUT
        String trimmedUsername = username == null ? "" : username.trim();
        boolean valid = trimmedUsername.length() >= 3
            && password != null
            && password.length() >= 8
            && email != null
            && !email.trim().isEmpty();

        if (!valid) {
            logLdd("[VALIDATION][IMP:9][registerUser][BLOCK_VALIDATE_INPUT][DECISION] registration rejected [STATUS:FAIL]", Map.of(
                "usernameLength", trimmedUsername.length(),
                "passwordLength", password == null ? 0 : password.length(),
                "hasEmail", email != null && !email.trim().isEmpty(),
                "reason", "VALIDATION_ERROR"
            ));
            return new RegisterResult(false, null, "VALIDATION_ERROR");
        }
        // END_BLOCK_VALIDATE_INPUT

        // START_BLOCK_CREATE_USER
        String userId = "user_" + trimmedUsername.toLowerCase();
        logLdd("[LOGIC][IMP:9][registerUser][BLOCK_CREATE_USER][STATE_CHANGE] user accepted [STATUS:OK]", Map.of(
            "userId", userId
        ));
        return new RegisterResult(true, userId, null);
        // END_BLOCK_CREATE_USER
    }
}
