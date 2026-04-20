"""
AI-Generated Code Detection Model Trainer
==========================================
Dataset: basakdemirok/AIGCodeSet
  - label 0 = human-written
  - label 1 = AI-generated (CodeStral, Gemini, CodeLLaMA)

Features used:
  - Structural: lines, code_lines, comments, functions, blank_lines (+ ratios)
  - Semantic:   384-dim sentence embedding via all-MiniLM-L6-v2

Classifier: XGBoost (fast inference, good on tabular+embedding mix)

Run from backend/:
    python -m ai_detection.train
  or
    python ai_detection/train.py

Output (saved to ai_detection/model/):
  - model.joblib      XGBoost classifier
  - scaler.joblib     StandardScaler for structural features
  - metadata.json     threshold, feature list, model info
"""

import os
# Must be set before any OpenMP-linked library (torch, xgboost) is imported.
# PyTorch bundles its own libomp; XGBoost links the system one.
# On macOS this double-load causes a segfault without this flag.
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import json
import re
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, roc_auc_score, accuracy_score, f1_score,
)
from xgboost import XGBClassifier

# ── paths ─────────────────────────────────────────────────────────────────────
AI_DETECTION_DIR = Path(__file__).parent
MODEL_DIR = AI_DETECTION_DIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ── feature extraction ────────────────────────────────────────────────────────

def count_functions(code: str) -> int:
    """Count function / method definitions (def / function keywords)."""
    return len(re.findall(
        r'^\s*def\s+\w+|^\s*function\s+\w+|^\s*public\s+\w+\s+\w+\s*\(',
        code, re.MULTILINE,
    ))


def extract_features(code: str) -> dict:
    """Extract structural features from a code string."""
    lines = code.splitlines()
    total = len(lines)
    blank = sum(1 for ln in lines if ln.strip() == "")
    comment = sum(1 for ln in lines if ln.strip().startswith(("#", "//", "*", "/*", "*/")))
    code_lines = max(total - blank - comment, 0)
    funcs = count_functions(code)

    return {
        "lines": total,
        "code_lines": code_lines,
        "comments": comment,
        "functions": funcs,
        "blank_lines": blank,
        "comment_ratio": comment / max(total, 1),
        "blank_ratio": blank / max(total, 1),
        "code_ratio": code_lines / max(total, 1),
        "avg_line_len": float(np.mean([len(ln) for ln in lines])) if lines else 0.0,
        "max_line_len": max((len(ln) for ln in lines), default=0),
        "func_density": funcs / max(total, 1),
    }


STRUCT_COLS = [
    "lines", "code_lines", "comments", "functions", "blank_lines",
    "comment_ratio", "blank_ratio", "code_ratio",
    "avg_line_len", "max_line_len", "func_density",
]


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("AI Code Detection - Training Pipeline")
    print("=" * 60)

    # 1. Load dataset ──────────────────────────────────────────────
    print("\n[1/6] Loading dataset from HuggingFace…")
    ds = load_dataset("basakdemirok/AIGCodeSet")
    print(f"  Splits available: {list(ds.keys())}")

    frames = []
    for split in ds:
        df_split = ds[split].to_pandas()
        df_split["_split"] = split
        frames.append(df_split)
    df = pd.concat(frames, ignore_index=True)

    df = df.dropna(subset=["code", "label"])
    df["label"] = df["label"].astype(int)
    df = df[df["label"].isin([0, 1])].reset_index(drop=True)
    print(f"  Total: {len(df):,}  |  Human: {(df['label']==0).sum():,}  |  AI: {(df['label']==1).sum():,}")

    # 2. Structural features ───────────────────────────────────────
    print("\n[2/6] Extracting structural features…")
    has_precomputed = all(c in df.columns for c in ["lines", "code_lines", "comments", "functions", "blank_lines"])
    if has_precomputed:
        print("  Using pre-computed columns from dataset.")
        for col in ["lines", "code_lines", "comments", "functions", "blank_lines"]:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
        df["comment_ratio"] = df["comments"] / df["lines"].clip(lower=1)
        df["blank_ratio"] = df["blank_lines"] / df["lines"].clip(lower=1)
        df["code_ratio"] = df["code_lines"] / df["lines"].clip(lower=1)
        df["avg_line_len"] = df["code"].apply(
            lambda c: float(np.mean([len(ln) for ln in c.splitlines()])) if c.splitlines() else 0.0
        )
        df["max_line_len"] = df["code"].apply(
            lambda c: max((len(ln) for ln in c.splitlines()), default=0)
        )
        df["func_density"] = df["functions"] / df["lines"].clip(lower=1)
    else:
        print("  Computing features from code…")
        feats = df["code"].apply(extract_features).apply(pd.Series)
        df = pd.concat([df, feats], axis=1)

    X_struct = df[STRUCT_COLS].values.astype(np.float32)

    # 3. Sentence embeddings ───────────────────────────────────────
    print("\n[3/6] Generating code embeddings (all-MiniLM-L6-v2)…")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    codes_truncated = [c[:2000] for c in df["code"].tolist()]
    embeddings = embedder.encode(
        codes_truncated,
        batch_size=64,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    print(f"  Embedding shape: {embeddings.shape}")

    # 4. Combine features & scale ──────────────────────────────────
    print("\n[4/6] Scaling structural features and combining…")
    scaler = StandardScaler()
    X_struct_scaled = scaler.fit_transform(X_struct)
    X = np.hstack([X_struct_scaled, embeddings])
    y = df["label"].values
    print(f"  Feature matrix shape: {X.shape}")

    # 5. Train XGBoost ─────────────────────────────────────────────
    print("\n[5/6] Training XGBoost classifier…")
    n_neg, n_pos = (y == 0).sum(), (y == 1).sum()
    scale_pos_weight = n_neg / max(n_pos, 1)
    print(f"  scale_pos_weight = {scale_pos_weight:.3f}")

    clf = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=42,
        n_jobs=1,       # single-threaded - avoids macOS OpenMP/fork segfault
        nthread=1,
    )

    # Stratified hold-out evaluation (avoids joblib/fork entirely)
    print("  Running stratified 80/20 hold-out evaluation…")
    X_tr, X_val, y_tr, y_val = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    clf.fit(X_tr, y_tr)
    val_pred = clf.predict(X_val)
    val_prob = clf.predict_proba(X_val)[:, 1]
    val_auc  = roc_auc_score(y_val, val_prob)
    val_f1   = f1_score(y_val, val_pred)
    val_acc  = accuracy_score(y_val, val_pred)
    print(f"  Val accuracy : {val_acc:.4f}")
    print(f"  Val F1       : {val_f1:.4f}")
    print(f"  Val ROC-AUC  : {val_auc:.4f}")
    print(classification_report(y_val, val_pred, target_names=["Human", "AI"]))

    # Re-fit on full dataset for the saved model
    print("  Re-fitting on full dataset…")
    clf.fit(X, y)

    y_pred = clf.predict(X)
    y_prob = clf.predict_proba(X)[:, 1]
    print(f"  Train accuracy : {accuracy_score(y, y_pred):.4f}")
    print(f"  Train F1       : {f1_score(y, y_pred):.4f}")
    print(f"  Train ROC-AUC  : {roc_auc_score(y, y_prob):.4f}")

    # 6. Save artefacts ────────────────────────────────────────────
    print("\n[6/6] Saving model artefacts…")
    joblib.dump(clf, MODEL_DIR / "model.joblib")
    joblib.dump(scaler, MODEL_DIR / "scaler.joblib")

    metadata = {
        "model_type": "XGBClassifier",
        "embedding_model": "all-MiniLM-L6-v2",
        "embedding_dim": int(embeddings.shape[1]),
        "structural_features": STRUCT_COLS,
        "threshold": 0.5,
        "val_roc_auc": float(val_auc),
        "val_f1": float(val_f1),
        "val_accuracy": float(val_acc),
        # keep cv_roc_auc_mean for backwards-compat with service.py log line
        "cv_roc_auc_mean": float(val_auc),
        "n_train": int(len(y)),
        "n_human": int(n_neg),
        "n_ai": int(n_pos),
        "labels": {"0": "human", "1": "ai"},
    }
    with open(MODEL_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n  Saved to: {MODEL_DIR}")
    print("  model.joblib    - XGBoost classifier")
    print("  scaler.joblib   - StandardScaler")
    print("  metadata.json   - thresholds & feature list")
    print("\nDone.")


if __name__ == "__main__":
    main()
