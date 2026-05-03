# PhishVigil
![Status](https://img.shields.io/badge/Status-Alpha-orange)

> Client-side phishing detection with on-prem analytics.

An open-source security platform that blocks phishing attempts directly in the browser using local ML inference, while providing self-hosted dashboards for threat intelligence and incident tracking.

## ✨ Key Features

- **Local Inference** – ONNX-powered models run in-browser via Web Workers. Zero latency, works offline, no cloud dependency.
- **Self-Hosted Analytics** – FastAPI backend + dashboard for SOC/IT teams. Track campaigns, false positives, and user risk profiles.

## 🏗️ Architecture
[ML Training] → exports optimized .onnx model\
↓\
[Browser Extension] → extracts features → local ONNX inference → block/allow navigation\
↓ (optional telemetry)\
[Backend Server] → ingests reports → powers SOC Dashboard

## Details
Documentation for individual components:

- [ML Training](ml/README.md) — model architecture, dataset, export pipeline
- [Browser Extension](extension/README.md) — manifest, permissions, inference flow
- Backend Server (Planned) — FastAPI + dashboard specs coming soon