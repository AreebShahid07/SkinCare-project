from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf
import sys
import importlib

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

    # Compatibility shim: some saved models reference internal module paths
    # like 'keras.src.models.functional' which may not be importable in
    # the runtime environment. Map those names to the installed public
    # keras modules so deserialization can find the classes.
    shim_map = [
        ("keras.src.models.functional", "keras.models.functional"),
        ("keras.src.models", "keras.models"),
        ("keras.src.layers", "keras.layers"),
        ("keras.src.saving", "keras.saving"),
    ]
    for alias, target in shim_map:
        if alias not in sys.modules:
            try:
                sys.modules[alias] = importlib.import_module(target)
            except Exception:
                # ignore failures — load_model will raise a clearer error later
                pass

    type_model = tf.keras.models.load_model(config.TYPE_MODEL_PATH, compile=False)
    cond_model = tf.keras.models.load_model(config.COND_MODEL_PATH, compile=False)

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
