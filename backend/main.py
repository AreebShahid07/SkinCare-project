from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import config
import ingredients
import models
from inference import aggregate_three_views, decode_image, predict_single
from schemas import IngredientRecommendation, IngredientRequest, SkinAnalysisResponse

predict_lock = Lock()
executor = ThreadPoolExecutor(max_workers=config.PREDICT_WORKERS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.load_all()
    ingredients.load_ingredients()
    yield
    executor.shutdown(wait=False)


app = FastAPI(lifespan=lifespan, title="Skin Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )


@app.post("/api/v1/analyze", response_model=SkinAnalysisResponse)
async def analyze_skin(
    front: UploadFile = File(..., description="Front-facing photo"),
    left: UploadFile = File(..., description="Left-side photo"),
    right: UploadFile = File(..., description="Right-side photo"),
) -> SkinAnalysisResponse:
    for name, file in [("front", front), ("left", left), ("right", right)]:
        if file.content_type not in config.ALLOWED_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"'{name}' must be JPEG, PNG or WebP",
            )

    raw: dict[str, bytes] = {}
    for name, file in [("front", front), ("left", left), ("right", right)]:
        data = await file.read()
        if len(data) > config.MAX_FILE_MB * config.BYTES_IN_MB:
            raise HTTPException(
                status_code=413,
                detail=f"'{name}' exceeds {config.MAX_FILE_MB}MB limit",
            )
        raw[name] = data

    imgs = {}
    for name, data in raw.items():
        try:
            imgs[name] = decode_image(data)
        except HTTPException as exc:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Could not decode '{name}' image -- ensure it is a valid JPEG, PNG, or WebP"
                ),
            ) from exc

    loop = asyncio.get_running_loop()

    def run_inference():
        with predict_lock:
            return [predict_single(imgs[v]) for v in config.VIEW_NAMES]

    results = await loop.run_in_executor(executor, run_inference)
    output = aggregate_three_views(results)
    good, neutral, bad = ingredients.get_personalized_ingredients(
        output["final_skin_type"],
        output["detected_conditions"],
        top_n=config.DEFAULT_INGREDIENT_TOP_N,
    )
    output["ingredients"] = IngredientRecommendation(
        good=good.to_dict(orient="records"),
        neutral=neutral.to_dict(orient="records"),
        bad=bad.to_dict(orient="records"),
    )
    return SkinAnalysisResponse(**output)


@app.post("/api/v1/ingredients", response_model=IngredientRecommendation)
async def recommend_ingredients(payload: IngredientRequest) -> IngredientRecommendation:
    good, neutral, bad = ingredients.get_personalized_ingredients(
        payload.skin_type,
        payload.detected_conditions,
        top_n=payload.top_n,
    )
    return IngredientRecommendation(
        good=good.to_dict(orient="records"),
        neutral=neutral.to_dict(orient="records"),
        bad=bad.to_dict(orient="records"),
    )


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "models_loaded": models.state is not None,
        "ingredients_loaded": ingredients.ing_state is not None,
        "type_model": models.type_model_name,
        "cond_model": models.cond_model_name,
    }
