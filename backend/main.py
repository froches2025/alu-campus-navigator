"""FastAPI application entry point."""

from dotenv import load_dotenv

load_dotenv()  # Must run before any module reads os.environ

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.navigation import router as navigation_router
from backend.services.pathfinder import load_graph

app = FastAPI(title="Campus Navigator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(navigation_router)


@app.on_event("startup")
def startup() -> None:
    load_graph()
