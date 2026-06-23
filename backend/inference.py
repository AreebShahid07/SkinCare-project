from __future__ import annotations

from collections import Counter

import cv2
import numpy as np
from fastapi import HTTPException

import config
import models


def skin_preprocess(img: np.ndarray) -> np.ndarray:
    img = img.astype(np.uint8)
    img = cv2.GaussianBlur(img, config.GAUSSIAN_BLUR_KERNEL, 0)
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l_chan, a_chan, b_chan = cv2.split(lab)
    clahe = cv2.createCLAHE(
        clipLimit=config.CLAHE_CLIP_LIMIT,
        tileGridSize=config.CLAHE_TILE_GRID,
    )
    l_chan = clahe.apply(l_chan)
    merged = cv2.merge((l_chan, a_chan, b_chan))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB).astype(np.float32)


def decode_image(file_bytes: bytes) -> np.ndarray:
    try:
        arr = np.frombuffer(file_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, config.IMG_SIZE)
        return img
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not decode image") from exc


def predict_single(img_rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    try:
        processed = skin_preprocess(img_rgb)
        tensor = np.expand_dims(processed, axis=0)
        state = models.get_state()
        type_probs = state.type_model.predict(tensor, verbose=0)[0]
        cond_scores = state.cond_model.predict(tensor, verbose=0)[0]
        return type_probs, cond_scores
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Model inference failed") from exc


def aggregate_three_views(results: list[tuple[np.ndarray, np.ndarray]]) -> dict:
    state = models.get_state()

    all_type_probs = [res[0] for res in results]
    all_cond_scores = [res[1] for res in results]

    per_view_types = [
        state.type_class_map[int(np.argmax(p))] for p in all_type_probs
    ]
    vote_counts = Counter(per_view_types)
    max_votes = max(vote_counts.values())
    top_types = [t for t, v in vote_counts.items() if v == max_votes]

    if len(top_types) == 1:
        final_skin_type = top_types[0]
    else:
        mean_type_probs = np.mean(all_type_probs, axis=0)
        final_skin_type = max(
            top_types, key=lambda t: mean_type_probs[state.type_index_map[t]]
        )

    per_view_confidences = [float(np.max(p)) * 100 for p in all_type_probs]
    mean_type_conf = float(
        np.mean(
            [
                all_type_probs[i][state.type_index_map[per_view_types[i]]]
                for i in range(len(all_type_probs))
            ]
        )
    ) * 100

    mean_cond_scores = np.mean(all_cond_scores, axis=0)

    cond_results: dict[str, dict[str, float | bool]] = {}
    detected_conditions: list[str] = []
    for i, cname in enumerate(state.cond_classes):
        score = float(mean_cond_scores[i]) * 100
        thresh = state.cond_thresholds[i] * 100
        detected = bool(mean_cond_scores[i] >= state.cond_thresholds[i])
        if detected:
            detected_conditions.append(cname)
        cond_results[cname] = {
            "score": round(score, config.SCORE_DECIMALS),
            "threshold": round(thresh, config.SCORE_DECIMALS),
            "detected": detected,
        }

    per_view_cond_scores = {
        config.VIEW_NAMES[j]: {
            cname: round(float(all_cond_scores[j][i]) * 100, config.SCORE_DECIMALS)
            for i, cname in enumerate(state.cond_classes)
        }
        for j in range(len(config.VIEW_NAMES))
    }

    return {
        "final_skin_type": final_skin_type,
        "type_confidence": round(mean_type_conf, config.SCORE_DECIMALS),
        "vote_counts": dict(vote_counts),
        "per_view_skin_types": {
            config.VIEW_NAMES[i]: {
                "skin_type": per_view_types[i],
                "confidence": round(per_view_confidences[i], config.SCORE_DECIMALS),
            }
            for i in range(len(config.VIEW_NAMES))
        },
        "detected_conditions": detected_conditions,
        "condition_scores": cond_results,
        "per_view_cond_scores": per_view_cond_scores,
    }
