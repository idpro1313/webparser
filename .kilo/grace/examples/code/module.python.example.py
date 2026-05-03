# FILE: examples/code/module.python.example.py
# VERSION: 0.1.0
# START_MODULE_CONTRACT
#   PURPOSE: Показывает строгие поля GRACE-контракта и LDD-маркеры в Python.
#   SCOPE: Валидация транзакции и наблюдаемые ветки ошибки/успеха.
#   DEPENDS: нет
#   LINKS: M-EXAMPLE / V-M-EXAMPLE
# END_MODULE_CONTRACT
#
# START_MODULE_MAP
#   process_transaction - Валидирует запрос перевода и возвращает стабильный результат.
# END_MODULE_MAP
#
# START_CHANGE_SUMMARY
#   LAST_CHANGE: v0.1.0 - Первичный строгий Python GRACE few-shot.
# END_CHANGE_SUMMARY

from __future__ import annotations

import logging
from dataclasses import dataclass


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class TransactionResult:
    success: bool
    transaction_id: str | None = None
    error: str | None = None


# START_CONTRACT: process_transaction
#   PURPOSE: Валидирует и принимает перевод только когда amount и состояние счетов корректны.
#   INPUTS: { source_account_id: str, target_account_id: str, amount: float }
#   OUTPUTS: { TransactionResult - принятый transaction id или стабильная ошибка }
#   SIDE_EFFECTS: Пишет строгие LDD-маркеры; пример не изменяет persistence.
#   LINKS: V-M-EXAMPLE scenario-transaction
#   PRECONDITIONS: amount > 0; source и target account ids не пустые.
#   POSTCONDITIONS: некорректная сумма возвращает INVALID_AMOUNT до BLOCK_ACCEPT_TRANSFER.
#   INVARIANTS: amount не меняется после валидации; используются стабильные error codes.
#   FORBIDDEN_CHANGES: не принимать нулевые или отрицательные суммы.
#   KEYWORDS: DOMAIN(Transaction); CONCEPT(Invariant); PATTERN(ResultObject)
# END_CONTRACT: process_transaction
def process_transaction(
    source_account_id: str,
    target_account_id: str,
    amount: float,
) -> TransactionResult:
    """Валидирует запрос транзакции и возвращает стабильный результат с trace evidence."""

    # START_BLOCK_VALIDATE_INPUT
    if not source_account_id or not target_account_id or amount <= 0:
        logger.warning(
            "[VALIDATION][IMP:9][process_transaction][BLOCK_VALIDATE_INPUT][DECISION] transaction rejected [STATUS:FAIL]",
            extra={
                "has_source": bool(source_account_id),
                "has_target": bool(target_account_id),
                "amount": amount,
                "reason": "INVALID_AMOUNT_OR_ACCOUNT",
            },
        )
        return TransactionResult(success=False, error="INVALID_AMOUNT_OR_ACCOUNT")
    # END_BLOCK_VALIDATE_INPUT

    # START_BLOCK_ACCEPT_TRANSFER
    transaction_id = f"txn_{source_account_id}_{target_account_id}"
    logger.info(
        "[LOGIC][IMP:9][process_transaction][BLOCK_ACCEPT_TRANSFER][STATE_CHANGE] transaction accepted [STATUS:OK]",
        extra={"transaction_id": transaction_id, "amount": amount},
    )
    return TransactionResult(success=True, transaction_id=transaction_id)
    # END_BLOCK_ACCEPT_TRANSFER
