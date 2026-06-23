from pathlib import Path

BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / "assets"

TYPE_MODEL_PATH = ASSETS_DIR / "skin_type_final.keras"
COND_MODEL_PATH = ASSETS_DIR / "condition_final.keras"
TYPE_META_PATH = ASSETS_DIR / "skin_type_metadata.json"
COND_META_PATH = ASSETS_DIR / "condition_thresholds.json"
INGREDIENT_EMBEDDINGS_PATH = ASSETS_DIR / "ingredient_embeddings.npy"
INGREDIENTS_DATA_PATH = ASSETS_DIR / "ingredients_data.json"
INGREDIENTS_CONFIG_PATH = ASSETS_DIR / "ingredients_config.json"
DEFAULT_INGREDIENT_TOP_N = 15

IMG_SIZE = (224, 224)
VIEW_NAMES = ["front", "left", "right"]
MAX_FILE_MB = 10
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

BYTES_IN_MB = 1024 * 1024
PREDICT_WORKERS = 1
SCORE_DECIMALS = 1

GAUSSIAN_BLUR_KERNEL = (3, 3)
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID = (8, 8)
