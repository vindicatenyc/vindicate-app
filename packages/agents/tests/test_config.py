"""Tests for the configuration system."""

import os
from pathlib import Path
from tempfile import NamedTemporaryFile

import pytest

from vindicate_agents.config import (
    LLMConfig,
    LLMProvider,
    PipelineConfig,
    VindicateConfig,
)


class TestLLMConfig:
    """Test suite for LLMConfig."""

    def test_default_values(self):
        """LLMConfig should have sensible defaults."""
        config = LLMConfig()

        assert config.provider == LLMProvider.GOOGLE
        assert config.model == "gemini-2.0-flash-exp"
        assert config.temperature == 0.0
        assert config.max_tokens == 4096
        assert config.timeout == 60.0
        assert config.api_key is None

    def test_custom_values(self):
        """LLMConfig should accept custom values."""
        config = LLMConfig(
            provider=LLMProvider.ANTHROPIC,
            model="claude-3-opus-20240229",
            temperature=0.7,
            max_tokens=8192,
            api_key="test-key",
            timeout=120.0,
        )

        assert config.provider == LLMProvider.ANTHROPIC
        assert config.model == "claude-3-opus-20240229"
        assert config.temperature == 0.7
        assert config.max_tokens == 8192
        assert config.api_key == "test-key"
        assert config.timeout == 120.0

    def test_temperature_validation(self):
        """Temperature should be between 0.0 and 2.0."""
        # Valid temperatures
        LLMConfig(temperature=0.0)
        LLMConfig(temperature=1.0)
        LLMConfig(temperature=2.0)

        # Invalid temperatures
        with pytest.raises(ValueError):
            LLMConfig(temperature=-0.1)

        with pytest.raises(ValueError):
            LLMConfig(temperature=2.1)

    def test_model_validation(self):
        """Model name cannot be empty."""
        with pytest.raises(ValueError):
            LLMConfig(model="")

        with pytest.raises(ValueError):
            LLMConfig(model="   ")

    def test_max_tokens_validation(self):
        """Max tokens must be positive and within limits."""
        with pytest.raises(ValueError):
            LLMConfig(max_tokens=0)

        with pytest.raises(ValueError):
            LLMConfig(max_tokens=-1)

        with pytest.raises(ValueError):
            LLMConfig(max_tokens=200001)

    def test_from_environment(self, monkeypatch):
        """LLMConfig should load from environment variables."""
        monkeypatch.setenv("VINDICATE_LLM_PROVIDER", "anthropic")
        monkeypatch.setenv("VINDICATE_LLM_MODEL", "claude-3-sonnet-20240229")
        monkeypatch.setenv("VINDICATE_LLM_TEMPERATURE", "0.5")
        monkeypatch.setenv("VINDICATE_LLM_MAX_TOKENS", "2048")
        monkeypatch.setenv("VINDICATE_LLM_API_KEY", "env-api-key")

        config = LLMConfig()

        assert config.provider == LLMProvider.ANTHROPIC
        assert config.model == "claude-3-sonnet-20240229"
        assert config.temperature == 0.5
        assert config.max_tokens == 2048
        assert config.api_key == "env-api-key"


class TestPipelineConfig:
    """Test suite for PipelineConfig."""

    def test_default_values(self):
        """PipelineConfig should have sensible defaults."""
        config = PipelineConfig()

        assert config.debug_mode is False
        assert config.enable_extraction is True
        assert config.enable_analysis is True
        assert config.enable_generation is True
        assert config.human_in_loop is False
        assert config.max_retries == 3
        assert config.retry_delay == 1.0

    def test_debug_mode_enabled(self):
        """Debug mode should be configurable."""
        config = PipelineConfig(debug_mode=True)
        assert config.debug_mode is True

    def test_agent_toggles(self):
        """Individual agents should be toggleable."""
        config = PipelineConfig(
            enable_extraction=False,
            enable_analysis=True,
            enable_generation=False,
        )

        assert config.enable_extraction is False
        assert config.enable_analysis is True
        assert config.enable_generation is False

    def test_human_in_loop(self):
        """Human-in-the-loop should be configurable."""
        config = PipelineConfig(human_in_loop=True)
        assert config.human_in_loop is True

    def test_retry_settings(self):
        """Retry settings should be configurable with validation."""
        config = PipelineConfig(max_retries=5, retry_delay=2.5)

        assert config.max_retries == 5
        assert config.retry_delay == 2.5

    def test_max_retries_validation(self):
        """Max retries should be within valid range."""
        with pytest.raises(ValueError):
            PipelineConfig(max_retries=-1)

        with pytest.raises(ValueError):
            PipelineConfig(max_retries=11)

    def test_from_environment(self, monkeypatch):
        """PipelineConfig should load from environment variables."""
        monkeypatch.setenv("VINDICATE_PIPELINE_DEBUG_MODE", "true")
        monkeypatch.setenv("VINDICATE_PIPELINE_ENABLE_EXTRACTION", "false")
        monkeypatch.setenv("VINDICATE_PIPELINE_HUMAN_IN_LOOP", "true")
        monkeypatch.setenv("VINDICATE_PIPELINE_MAX_RETRIES", "5")

        config = PipelineConfig()

        assert config.debug_mode is True
        assert config.enable_extraction is False
        assert config.human_in_loop is True
        assert config.max_retries == 5


class TestVindicateConfig:
    """Test suite for VindicateConfig."""

    def test_default_values(self):
        """VindicateConfig should have sensible defaults."""
        config = VindicateConfig()

        assert config.env == "development"
        assert config.log_level == "INFO"
        assert config.data_dir == "./data"

        # Check nested configs have defaults
        assert config.llm.model == "gemini-2.0-flash-exp"
        assert config.pipeline.debug_mode is False

    def test_nested_config_access(self):
        """Should be able to access nested configuration."""
        config = VindicateConfig()

        # LLM config
        assert config.llm.provider == LLMProvider.GOOGLE
        assert config.llm.temperature == 0.0

        # Pipeline config
        assert config.pipeline.enable_extraction is True
        assert config.pipeline.max_retries == 3

    def test_custom_nested_config(self):
        """Should accept custom nested configuration."""
        config = VindicateConfig(
            llm=LLMConfig(model="custom-model", temperature=0.5),
            pipeline=PipelineConfig(debug_mode=True),
        )

        assert config.llm.model == "custom-model"
        assert config.llm.temperature == 0.5
        assert config.pipeline.debug_mode is True

    def test_environment_validation(self):
        """Environment should be validated."""
        # Valid environments
        VindicateConfig(env="development")
        VindicateConfig(env="staging")
        VindicateConfig(env="production")
        VindicateConfig(env="test")

        # Invalid environment
        with pytest.raises(ValueError):
            VindicateConfig(env="invalid")

    def test_environment_case_insensitive(self):
        """Environment should be case-insensitive."""
        config = VindicateConfig(env="PRODUCTION")
        assert config.env == "production"

        config = VindicateConfig(env="Development")
        assert config.env == "development"

    def test_log_level_validation(self):
        """Log level should be validated."""
        # Valid log levels
        VindicateConfig(log_level="DEBUG")
        VindicateConfig(log_level="INFO")
        VindicateConfig(log_level="WARNING")
        VindicateConfig(log_level="ERROR")
        VindicateConfig(log_level="CRITICAL")

        # Invalid log level
        with pytest.raises(ValueError):
            VindicateConfig(log_level="INVALID")

    def test_log_level_case_insensitive(self):
        """Log level should be case-insensitive."""
        config = VindicateConfig(log_level="debug")
        assert config.log_level == "DEBUG"

        config = VindicateConfig(log_level="Warning")
        assert config.log_level == "WARNING"

    def test_is_production_property(self):
        """is_production should return True only in production."""
        config = VindicateConfig(env="production")
        assert config.is_production is True

        config = VindicateConfig(env="development")
        assert config.is_production is False

    def test_is_development_property(self):
        """is_development should return True only in development."""
        config = VindicateConfig(env="development")
        assert config.is_development is True

        config = VindicateConfig(env="production")
        assert config.is_development is False

    def test_is_debug_property(self):
        """is_debug should return True when debug mode or DEBUG log level."""
        # Debug via pipeline
        config = VindicateConfig(pipeline=PipelineConfig(debug_mode=True))
        assert config.is_debug is True

        # Debug via log level
        config = VindicateConfig(log_level="DEBUG")
        assert config.is_debug is True

        # Not debug
        config = VindicateConfig(
            log_level="INFO",
            pipeline=PipelineConfig(debug_mode=False),
        )
        assert config.is_debug is False

    def test_from_environment(self, monkeypatch):
        """VindicateConfig should load from environment variables."""
        monkeypatch.setenv("VINDICATE_ENV", "production")
        monkeypatch.setenv("VINDICATE_LOG_LEVEL", "WARNING")
        monkeypatch.setenv("VINDICATE_DATA_DIR", "/custom/path")

        config = VindicateConfig()

        assert config.env == "production"
        assert config.log_level == "WARNING"
        assert config.data_dir == "/custom/path"

    def test_loads_from_dotenv_file(self, tmp_path, monkeypatch):
        """VindicateConfig should load from .env file."""
        # Create a temporary .env file
        env_file = tmp_path / ".env"
        env_file.write_text(
            "VINDICATE_ENV=staging\n"
            "VINDICATE_LOG_LEVEL=ERROR\n"
            "VINDICATE_LLM_MODEL=test-model\n"
            "VINDICATE_PIPELINE_DEBUG_MODE=true\n"
        )

        # Change to temp directory so .env is found
        monkeypatch.chdir(tmp_path)

        config = VindicateConfig()

        assert config.env == "staging"
        assert config.log_level == "ERROR"
        assert config.llm.model == "test-model"
        assert config.pipeline.debug_mode is True

    def test_validates_on_instantiation(self):
        """Configuration should validate on instantiation."""
        # This should raise on invalid values
        with pytest.raises(ValueError):
            VindicateConfig(env="invalid-env")

        with pytest.raises(ValueError):
            VindicateConfig(log_level="NOTVALID")

        with pytest.raises(ValueError):
            VindicateConfig(llm=LLMConfig(temperature=5.0))


class TestLLMProvider:
    """Test suite for LLMProvider enum."""

    def test_provider_values(self):
        """LLMProvider should have expected values."""
        assert LLMProvider.ANTHROPIC.value == "anthropic"
        assert LLMProvider.GOOGLE.value == "google"
        assert LLMProvider.OPENAI.value == "openai"

    def test_provider_from_string(self):
        """LLMProvider should be creatable from string."""
        assert LLMProvider("anthropic") == LLMProvider.ANTHROPIC
        assert LLMProvider("google") == LLMProvider.GOOGLE
        assert LLMProvider("openai") == LLMProvider.OPENAI
