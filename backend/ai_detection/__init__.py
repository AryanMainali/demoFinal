"""
AI-Generated Code Detection package.

Structure:
  ai_detection/
    train.py      — download dataset & train XGBoost model
    service.py    — inference service (loaded by the FastAPI endpoint)
    model/        — saved artefacts: model.joblib, scaler.joblib, metadata.json
"""
