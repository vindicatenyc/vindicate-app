"""Configuration system for Vindicate Agents.

This module provides Pydantic Settings-based configuration with environment
variable support and sensible defaults for the Vindicate agent pipeline.

Usage:
    from vindicate_agents.config import VindicateConfig

    # Load from environment variables and .env file
    config = VindicateConfig()

    # Access LLM settings
    print(config.llm.model)
    print(config.llm.temperature)

    # Access pipeline settings
    if config.pipeline.debug_mode:
        print("Debug mode enabled")
"""

from enum import Enum
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    OPENAI = "openai"


class LLMConfig(BaseSettings):
    """LLM configuration settings.

    Configuration for the language model used by agents. Supports environment
    variables with the prefix VINDICATE_LLM_.

    Environment Variables:
        VINDICATE_LLM_PROVIDER: LLM provider (anthropic, google, openai)
        VINDICATE_LLM_MODEL: Model name (e.g., gemini-2.0-flash-exp)
        VINDICATE_LLM_TEMPERATURE: Sampling temperature (0.0-2.0)
        VINDICATE_LLM_MAX_TOKENS: Maximum output tokens
        VINDICATE_LLM_API_KEY: API key for the provider
        VINDICATE_LLM_TIMEOUT: Request timeout in seconds
    """

    model_config = SettingsConfigDict(
        env_prefix="VINDICATE_LLM_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    provider: LLMProvider = Field(
        default=LLMProvider.GOOGLE,
        description="LLM provider to use",
    )
    model: str = Field(
        default="gemini-2.0-flash-exp",
        description="Model identifier for the LLM",
    )
    temperature: float = Field(
        default=0.0,
        ge=0.0,
        le=2.0,
        description="Sampling temperature for generation",
    )
    max_tokens: int = Field(
        default=4096,
        gt=0,
        le=200000,
        description="Maximum tokens in response",
    )
    api_key: Optional[str] = Field(
        default=None,
        description="API key for the LLM provider",
    )
    timeout: float = Field(
        default=60.0,
        gt=0,
        description="Request timeout in seconds",
    )

    @field_validator("model")
    @classmethod
    def validate_model(cls, v: str) -> str:
        """Ensure model name is not empty."""
        if not v or not v.strip():
            raise ValueError("Model name cannot be empty")
        return v.strip()


class PipelineConfig(BaseSettings):
    """Pipeline configuration settings.

    Controls agent pipeline behavior including which agents are enabled,
    debug settings, and human-in-the-loop options.

    Environment Variables:
        VINDICATE_PIPELINE_DEBUG_MODE: Enable verbose debug logging
        VINDICATE_PIPELINE_ENABLE_EXTRACTION: Enable document extraction agent
        VINDICATE_PIPELINE_ENABLE_ANALYSIS: Enable financial analysis agent
        VINDICATE_PIPELINE_ENABLE_GENERATION: Enable report generation agent
        VINDICATE_PIPELINE_HUMAN_IN_LOOP: Require human approval for actions
        VINDICATE_PIPELINE_MAX_RETRIES: Maximum retry attempts for failed operations
        VINDICATE_PIPELINE_RETRY_DELAY: Delay between retries in seconds
    """

    model_config = SettingsConfigDict(
        env_prefix="VINDICATE_PIPELINE_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    debug_mode: bool = Field(
        default=False,
        description="Enable verbose debug logging for development",
    )
    enable_extraction: bool = Field(
        default=True,
        description="Enable the document extraction agent",
    )
    enable_analysis: bool = Field(
        default=True,
        description="Enable the financial analysis agent",
    )
    enable_generation: bool = Field(
        default=True,
        description="Enable the report generation agent",
    )
    human_in_loop: bool = Field(
        default=False,
        description="Require human approval before executing actions",
    )
    max_retries: int = Field(
        default=3,
        ge=0,
        le=10,
        description="Maximum retry attempts for failed operations",
    )
    retry_delay: float = Field(
        default=1.0,
        ge=0,
        description="Delay between retry attempts in seconds",
    )


class VindicateConfig(BaseSettings):
    """Root configuration for Vindicate Agents.

    This is the main configuration class that combines all configuration
    subsections. It supports loading from environment variables and .env files.

    Environment Variables:
        VINDICATE_ENV: Environment name (development, staging, production)
        VINDICATE_LOG_LEVEL: Logging level (DEBUG, INFO, WARNING, ERROR)
        VINDICATE_DATA_DIR: Directory for data files

    Example:
        # Load all configuration from environment
        config = VindicateConfig()

        # Override specific settings
        config = VindicateConfig(
            llm=LLMConfig(model="claude-3-opus-20240229"),
            pipeline=PipelineConfig(debug_mode=True),
        )

        # Access configuration
        if config.pipeline.debug_mode:
            print(f"Using model: {config.llm.model}")
    """

    model_config = SettingsConfigDict(
        env_prefix="VINDICATE_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Environment settings
    env: str = Field(
        default="development",
        description="Environment name (development, staging, production)",
    )
    log_level: str = Field(
        default="INFO",
        description="Logging level",
    )
    data_dir: str = Field(
        default="./data",
        description="Directory for data files",
    )

    # Nested configuration
    llm: LLMConfig = Field(default_factory=LLMConfig)
    pipeline: PipelineConfig = Field(default_factory=PipelineConfig)

    @field_validator("env")
    @classmethod
    def validate_env(cls, v: str) -> str:
        """Validate environment name."""
        valid_envs = {"development", "staging", "production", "test"}
        v_lower = v.lower().strip()
        if v_lower not in valid_envs:
            raise ValueError(f"Invalid environment: {v}. Must be one of: {valid_envs}")
        return v_lower

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate and normalize log level."""
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        v_upper = v.upper().strip()
        if v_upper not in valid_levels:
            raise ValueError(f"Invalid log level: {v}. Must be one of: {valid_levels}")
        return v_upper

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.env == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.env == "development"

    @property
    def is_debug(self) -> bool:
        """Check if debug mode is enabled (via pipeline or log level)."""
        return self.pipeline.debug_mode or self.log_level == "DEBUG"
