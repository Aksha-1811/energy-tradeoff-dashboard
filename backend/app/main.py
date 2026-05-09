from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .analytics import AnalyticsConfig, load_enb_txt, parse_uploaded_txt, build_payload
from .schemas import EnergyResponse

app = FastAPI(title="Analytics Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_DATA_PATH = "data/ENB.txt"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/energy/tradeoff", response_model=EnergyResponse)
def energy_tradeoff(seed: int = 225451065, sample_rows: int = 650):
    cfg = AnalyticsConfig(seed=seed, sample_rows=sample_rows)
    try:
        df = load_enb_txt(DEFAULT_DATA_PATH)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset: {e}")
    return build_payload(df, cfg, source="ENB.txt (local)")


@app.post("/energy/tradeoff/upload", response_model=EnergyResponse)
async def energy_tradeoff_upload(
    file: UploadFile = File(...),
    seed: int = 225451065,
    sample_rows: int = 650,
):
    cfg = AnalyticsConfig(seed=seed, sample_rows=sample_rows)
    content = await file.read()
    try:
        df = parse_uploaded_txt(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")
    return build_payload(df, cfg, source=f"upload:{file.filename}")
