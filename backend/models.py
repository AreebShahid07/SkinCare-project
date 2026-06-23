from __future__ import annotations

from dataclasses import dataclass
import json
import os
from pathlib import Path
from typing import Any
import types
import importlib
import sys

import numpy as np

os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")

import tensorflow as tf

import config


@dataclass
class AppState:
    type_model: Any
    cond_model: Any
    type_class_map: dict[int, str]
    type_index_map: dict[str, int]
    cond_classes: list[str]
    cond_thresholds: list[float]


state: AppState | None = None
type_model_name: str | None = None
cond_model_name: str | None = None


def _read_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _register_keras_compat_modules() -> None:
    functional_module = sys.modules.get("keras.src.models.functional")
    if functional_module is None:
        functional_module = types.ModuleType("keras.src.models.functional")
        functional_module.__package__ = "keras.src.models"
        functional_module.Functional = getattr(tf.keras.models, "Functional", tf.keras.Model)
        functional_module.Model = tf.keras.Model
        sys.modules["keras.src.models.functional"] = functional_module

    models_module = sys.modules.get("keras.src.models")
    if models_module is None:
        models_module = types.ModuleType("keras.src.models")
        models_module.__package__ = "keras.src"
        models_module.__path__ = []
        sys.modules["keras.src.models"] = models_module

    src_module = sys.modules.get("keras.src")
    if src_module is None:
        src_module = types.ModuleType("keras.src")
        src_module.__package__ = "keras"
        src_module.__path__ = []
        sys.modules["keras.src"] = src_module

    models_module.functional = functional_module
    src_module.models = models_module


_register_keras_compat_modules()


_original_import_module = importlib.import_module


def _compat_import_module(name: str, package: str | None = None):
    if name in sys.modules:
        return sys.modules[name]
    if name == "keras.src.models.functional":
        return sys.modules[name]
    return _original_import_module(name, package)


def load_all() -> None:
    global state, type_model_name, cond_model_name

    if state is not None:
        return

    type_meta = _read_json(config.TYPE_META_PATH)
    type_index_map = {k: int(v) for k, v in type_meta["class_indices"].items()}
    type_class_map = {v: k for k, v in type_index_map.items()}
    type_model_name = str(type_meta.get("model", "unknown"))

    cond_meta = _read_json(config.COND_META_PATH)
    cond_classes = list(cond_meta["classes"])
    thresholds = cond_meta["thresholds"]
    cond_thresholds = [float(thresholds[c]) for c in cond_classes]
    cond_model_name = str(cond_meta.get("model", "unknown"))

    # Some saved Keras archives embed internal module paths that are not
    # importable in the deployment runtime. Patch import_module only while
    # deserializing so Keras can resolve those legacy paths.
    importlib.import_module = _compat_import_module
    try:
        type_model = tf.keras.models.load_model(config.TYPE_MODEL_PATH, compile=False)
        cond_model = tf.keras.models.load_model(config.COND_MODEL_PATH, compile=False)
    finally:
        importlib.import_module = _original_import_module

    dummy = np.zeros((1, config.IMG_SIZE[1], config.IMG_SIZE[0], 3), dtype=np.float32)
    type_model.predict(dummy, verbose=0)
    cond_model.predict(dummy, verbose=0)

    state = AppState(
        type_model=type_model,
        cond_model=cond_model,
        type_class_map=type_class_map,
        type_index_map=type_index_map,
        cond_classes=cond_classes,
        cond_thresholds=cond_thresholds,
    )


def get_state() -> AppState:
    if state is None:
        raise RuntimeError("Models are not loaded")
    return state
