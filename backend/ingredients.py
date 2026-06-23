from __future__ import annotations

from dataclasses import dataclass
import json
from typing import Any

import numpy as np
import pandas as pd
import onnxruntime as ort
from transformers import AutoTokenizer

import config


class LightSBERT:
    def __init__(self, model_dir: str):
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.session = ort.InferenceSession(
            f"{model_dir}/model.onnx",
            providers=["CPUExecutionProvider"],
        )

    def encode(self, texts: list[str], normalize_embeddings=True) -> np.ndarray:
        encoded = self.tokenizer(
            texts, padding=True, truncation=True,
            max_length=128, return_tensors="np"
        )
        input_feed = {k: v.astype(np.int64) for k, v in encoded.items()}
        outputs = self.session.run(None, input_feed)
        # mean pooling
        embeddings = outputs[0].mean(axis=1)
        if normalize_embeddings:
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / (norms + 1e-9)
        return embeddings



@dataclass
class IngredientState:
    sbert: Any
    embeddings: np.ndarray
    df: pd.DataFrame
    cfg: dict


ing_state: IngredientState | None = None


def _read_json(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def load_ingredients() -> None:
    global ing_state

    if ing_state is not None:
        return

    cfg = _read_json(config.INGREDIENTS_CONFIG_PATH)
    data = _read_json(config.INGREDIENTS_DATA_PATH)
    embeddings = np.load(config.INGREDIENT_EMBEDDINGS_PATH).astype(np.float32)
    df = pd.DataFrame(data)

    sbert = LightSBERT(str(config.ASSETS_DIR / "sbert_onnx"))

    ing_state = IngredientState(sbert=sbert, embeddings=embeddings, df=df, cfg=cfg)


def get_ingredient_state() -> IngredientState:
    if ing_state is None:
        raise RuntimeError("Ingredient assets are not loaded")
    return ing_state


def _normalize(arr: np.ndarray) -> np.ndarray:
    mn, mx = arr.min(), arr.max()
    return (arr - mn) / (mx - mn + 1e-9)


def get_user_profile_tags(skin_type: str, conditions: list[str], cfg: dict):
    good = set(cfg["skin_type_good_tag_map"].get(skin_type, [])) | set(
        cfg["universal_good_tags"]
    )
    avoid = set(cfg["skin_type_avoid_tag_map"].get(skin_type, []))
    for c in conditions:
        good |= set(cfg["condition_tag_map"].get(c, []))
    exclude = set(cfg["exclude_tags"])
    good -= exclude
    avoid -= exclude
    return good, avoid


def build_profile_text(skin_type: str, conditions: list[str], cfg: dict) -> str:
    parts = [cfg["skin_type_descriptions"].get(skin_type, "")]
    parts += [cfg["condition_descriptions"].get(c, "") for c in conditions]
    return " ".join(p for p in parts if p)


def get_personalized_ingredients(
    skin_type: str,
    conditions: list[str],
    top_n: int | None = None,
):
    load_ingredients()
    state = get_ingredient_state()
    cfg = state.cfg
    top_n = top_n or cfg["default_top_n"]

    good_tags, avoid_tags = get_user_profile_tags(skin_type, conditions, cfg)
    profile_text = build_profile_text(skin_type, conditions, cfg)

    query_emb = state.sbert.encode([profile_text], normalize_embeddings=True)
    nlp_scores = (query_emb @ state.embeddings.T).flatten()
    nlp_n = _normalize(nlp_scores)

    df = state.df
    n = len(df)
    exclude = set(cfg["exclude_tags"])
    tag_good_scores = np.zeros(n)
    avoid_flags = np.zeros(n, dtype=bool)
    matched_good_col = [""] * n
    matched_avoid_col = [""] * n

    for i, (good_for, avoid_for) in enumerate(zip(df["good_for_tags"], df["avoid_tags"])):
        ing_good = set(good_for) - exclude
        ing_avoid = set(avoid_for) - exclude
        overlap_good = ing_good & good_tags
        overlap_avoid = ing_avoid & avoid_tags
        if good_tags:
            tag_good_scores[i] = len(overlap_good) / len(good_tags)
        avoid_flags[i] = len(overlap_avoid) > 0
        matched_good_col[i] = ", ".join(sorted(overlap_good))
        matched_avoid_col[i] = ", ".join(sorted(overlap_avoid))

    tag_weight = cfg["tag_weight"]
    nlp_weight = cfg["nlp_weight"]
    threshold = cfg["nlp_promote_threshold"]

    labels, scores = [], []
    for i in range(n):
        if avoid_flags[i]:
            labels.append("BAD")
            scores.append(0.0)
        elif tag_good_scores[i] > 0:
            labels.append("GOOD")
            scores.append(round(tag_weight * tag_good_scores[i] + nlp_weight * nlp_n[i], 4))
        elif nlp_n[i] >= threshold:
            labels.append("GOOD")
            scores.append(round(nlp_weight * nlp_n[i], 4))
        else:
            labels.append("NEUTRAL")
            scores.append(round(nlp_n[i], 4))

    results = pd.DataFrame(
        {
            "name": df["name"].values,
            "label": labels,
            "score": scores,
            "matched_good_tags": matched_good_col,
            "matched_avoid_tags": matched_avoid_col,
            "short_description": df["short_description"].values,
            "what_does_it_do": df["what_does_it_do"].values,
            "url": df["url"].values,
        }
    )

    good = (
        results[results["label"] == "GOOD"]
        .sort_values("score", ascending=False)
        .head(top_n)
        .reset_index(drop=True)
    )
    neutral = (
        results[results["label"] == "NEUTRAL"]
        .sort_values("score", ascending=False)
        .head(top_n)
        .reset_index(drop=True)
    )
    bad = results[results["label"] == "BAD"].sort_values("name").reset_index(drop=True)
    return good, neutral, bad