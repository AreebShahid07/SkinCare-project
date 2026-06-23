from pydantic import BaseModel


class PerViewType(BaseModel):
    skin_type: str
    confidence: float


class ConditionDetail(BaseModel):
    score: float
    threshold: float
    detected: bool


class IngredientItem(BaseModel):
    name: str
    score: float
    matched_good_tags: str
    matched_avoid_tags: str
    short_description: str
    what_does_it_do: str
    url: str


class IngredientRecommendation(BaseModel):
    good: list[IngredientItem]
    neutral: list[IngredientItem]
    bad: list[IngredientItem]


class IngredientRequest(BaseModel):
    skin_type: str
    detected_conditions: list[str]
    top_n: int | None = None


class SkinAnalysisResponse(BaseModel):
    final_skin_type: str
    type_confidence: float
    vote_counts: dict[str, int]
    per_view_skin_types: dict[str, PerViewType]
    detected_conditions: list[str]
    condition_scores: dict[str, ConditionDetail]
    per_view_cond_scores: dict[str, dict[str, float]]
    ingredients: IngredientRecommendation
