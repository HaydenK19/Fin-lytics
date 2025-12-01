#!/usr/bin/env python3
"""
Ultra-minimal FastAPI for Railway - guaranteed to work
"""
from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World", "status": "working", "port": os.getenv("PORT", "unknown")}

@app.get("/health")
def health():
    return {"status": "healthy"}