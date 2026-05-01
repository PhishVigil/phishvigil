# PhishVigil ML Training

Based on dataset from Kaggle: [Phishing URL Detection (111K URLs, 22 Features)](https://www.kaggle.com/datasets/sahandnamvar/phishing-url-detection-111k-urls-22-features)

## Tested models:
Testing on `cross_val_score(cv=4)`

| Model | Accuracy | False Positive Rate (safe → phishing) | False Negative Rate (phishing → safe) |
| ----- | -------- | ------------------------------------- | ------------------------------------- |
|DecisionTreeClassifier | 0.962 ± 0.007 | 1.6% | 10.0% |
|HistGradientBoostingClassifier | 0.974 ± 0.005 | 0.8% | 9.4% |

>⚠️ Model Export Note:\
While `HistGradientBoostingClassifier` demonstrates superior accuracy during evaluation, we currently export `DecisionTreeClassifier` due to a known compatibility issue with `skl2onnx`. We plan to switch to the boosting model once the upstream converter is patched or a workaround is implemented.

## Quick start
```bash
cd .\ml\
uv sync
```
Notebook `cwd` should be `ml/notebooks/`