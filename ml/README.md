# PhishVigil ML Training Research

### Initial Approach
We started by training a **Decision Tree Classifier** on the [Phishing URL Detection (111K URLs, 22 Features)](https://www.kaggle.com/datasets/sahandnamvar/phishing-url-detection-111k-urls-22-features) from Kaggle. The model achieved strong metrics on cross validation (`cross_val_score(cv=4)`):

| Metric | Value |
| ------ | ----- |
| F1-macro | 0.942 |
| Safe Recall | 0.984 |
| Phishing Recall | 0.898 |

### The Problem: False Positives in Real-World Testing
Despite good validation metrics, testing on real-world URLs revealed **excessive false positives** on legitimate sites

### Root Cause Analysis
We identified two key issues with the original dataset:

1. **Overly "clean" legitimate URLs**:  
Most safe URLs in the dataset were root domains only (e.g., `https://example.com/`), lacking the complex paths, UUIDs, query parameters, and hash fragments common in modern SPAs and web applications. The model had never learned that `path=/c/UUID` or `query=?token=abc123` can be legitimate.

2. **`www.` prevalence bias**:  
~76% of legitimate URLs in the dataset included the `www.` subdomain, while only ~4% of phishing URLs did. This strong correlation was likely an artifact of the original author's data collection methodology (e.g., scraping "top sites" lists vs. threat feeds). However, this does not reflect the modern web, where many legitimate services use apex domains (`app.notion.so`, `chat.openai.com`, `github.com`) or omit `www.` by design.

### The Solution: Domain-Only Features + Canonicalization
We made two key changes:

1. **URL canonicalization**: Strip `www.` from all URLs during preprocessing to remove the dataset bias.
2. **Domain-only feature extraction**: Train the model exclusively on features derived from the domain portion of the URL, ignoring path, query, and fragment entirely.


### Results
After retraining with the simplified, domain-only feature set:


| Metric | Value |
| ------ | ----- |
| F1-macro | 0.887 |
| Safe Recall | 0.979 | 
| Phishing Recall | 0.759 |


While overall accuracy decreased, **false positives on legitimate complex URLs dropped dramatically** (subjectively evaluated during manual testing).

### Key Insight
> **A model optimized for historical dataset statistics may not generalize to real-world usage patterns.**  
> By focusing on *domain structure* rather than surface-level artifacts (`www.`, path complexity), we built a more robust detector that trades a small amount of recall for significantly better user experience.

### Future Work & TODOs

Using the publicly available [Phishing URL Detection Dataset](https://www.kaggle.com/datasets/sahandnamvar/phishing-url-detection-111k-urls-22-features) provided an excellent foundation for prototyping and initial model development. However, continued reliance on this dataset will likely limit further improvements in real-world performance.

Therefore, one of the highest-priority future tasks for this project is the collection of a proprietary, high-quality dataset featuring:
- **Legitimate URLs**: Real-world examples from active browser sessions: complex paths, UUIDs, hash fragments, dynamic query parameters, modern SPA patterns
- **Phishing URLs**: Fresh samples from threat intelligence feeds, including trusted-service abuse (`docs.google.com/document/d/MALICIOUS_ID`), typosquatting variants, and newly registered domains
- **Metadata**: Domain registration date, HTTPS certificate info, redirect chains, and contextual signals for richer feature engineering

## Usage
```bash
git clone https://github.com/PhishVigil/phishvigil.git
cd .\ml\
uv sync
```

To export model, run:
1. `0-download_kaggle_dataset.ipynb` - first time only
2. `2-feature_extraction.ipynb` - to prepare dataset
3. `3-training.ipynb` - to train and export model

> Notebook `1-analysis.ipynb` is optional