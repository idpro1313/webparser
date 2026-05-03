//go:build ignore

// FILE: examples/code/module.go.example.go
// VERSION: 0.1.0
// START_MODULE_CONTRACT
//   PURPOSE: Показывает GRACE-разметку для Go-модулей.
//   SCOPE: Валидация конфигурации со стабильными block-маркерами.
//   DEPENDS: encoding/json
//   LINKS: M-CONFIG / V-M-CONFIG
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ParseConfigBytes - Parses and validates config bytes.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: v0.1.0 - Первичный Go GRACE few-shot.
// END_CHANGE_SUMMARY

package graceexample

import (
	"encoding/json"
	"errors"
)

type Config struct {
	Name string `json:"name"`
}

// START_CONTRACT: ParseConfigBytes
//   PURPOSE: Парсит JSON config bytes и отклоняет config без обязательных полей.
//   INPUTS: { data: []byte - JSON config payload }
//   OUTPUTS: { Config, error - распарсенный config или стабильная validation error }
//   SIDE_EFFECTS: нет
//   LINKS: V-M-CONFIG scenario-parse-config
// END_CONTRACT: ParseConfigBytes
func ParseConfigBytes(data []byte) (Config, error) {
	// START_BLOCK_PARSE_JSON
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, err
	}
	// END_BLOCK_PARSE_JSON

	// START_BLOCK_VALIDATE_CONFIG
	if cfg.Name == "" {
		return Config{}, errors.New("CONFIG_NAME_REQUIRED")
	}
	return cfg, nil
	// END_BLOCK_VALIDATE_CONFIG
}
