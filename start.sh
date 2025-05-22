#!/bin/sh

npm run preview --port 5174 &
uvicorn backend.main:app --host 0.0.0.0 --port 8001